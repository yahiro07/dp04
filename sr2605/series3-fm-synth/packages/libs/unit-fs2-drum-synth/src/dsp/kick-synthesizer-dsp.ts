import {
  clampValue,
  fracPart,
  linearInterpolate,
  mapUnaryTo,
  power3,
} from "@my/lib/ax/number-utils";
import { writeBuffer } from "@my/lib/mo-dsp/buffer-functions";
import {
  curveMapper,
  mapExpCurve,
  tunableSigmoid,
} from "@my/lib/mo-dsp/curves";
import { createInterpolator, Interpolator } from "@my/lib/mo-dsp/interpolator";
import { getOscWaveformPdSaw } from "@my/lib/mo-dsp/pd-saw";
import { applySoftClip } from "@my/lib/mo-dsp/soft-clip-shaper";
import { midiToFrequency } from "@my/lib/mo-dsp/synthesis-helper";
import {
  createDefaultUnitParameters,
  KickEgWave,
  KickParameterKey,
  KickParametersSuit,
} from "@/base/parameters";
import { KickPresetKey, kickPresets } from "@/base/presets";

function getEgWaveCurve(wave: KickEgWave, x: number, w: number) {
  if (wave === KickEgWave.ds) {
    const base = w;
    return base + (1 - base) * mapExpCurve(1 - x);
  } else if (wave === KickEgWave.d) {
    const scaler = mapUnaryTo(1 - w, 1, 16);
    return mapExpCurve(1 - x, scaler);
  } else if (wave === KickEgWave.hd) {
    if (x <= w) {
      return 1;
    } else {
      const u = linearInterpolate(x, w, 1, 1, 0);
      return u * u;
    }
  }
  return 0;
}

const egWaveCurveFunctions = {
  [KickEgWave.ds]: (x: number, w: number) =>
    getEgWaveCurve(KickEgWave.ds, x, w),
  [KickEgWave.d]: (x: number, w: number) => getEgWaveCurve(KickEgWave.d, x, w),
  [KickEgWave.hd]: (x: number, w: number) =>
    getEgWaveCurve(KickEgWave.hd, x, w),
};
export function kickSynthExports_getEgWaveCurveFunction(
  wave: KickEgWave,
): (x: number, w: number) => number {
  return egWaveCurveFunctions[wave];
}

function calcOscDelta(noteNumber: number, prPitch: number, sampleRate: number) {
  let relNoteValue = 0;
  const notesHalfRange = 24;
  relNoteValue = mapUnaryTo(prPitch, -notesHalfRange, notesHalfRange);
  const modNoteNumber = noteNumber + relNoteValue;
  const frequency = midiToFrequency(modNoteNumber) * 1;
  return frequency / sampleRate;
}

type StateBus = {
  parameters: KickParametersSuit;
  sampleRate: number;
  ampEgValue: number;
  pitchEgValue: number;
  noteNumber: number;
  currentTime: number;
  gateOn: boolean;
  ampToleLevel: number;
  gateTriggered: boolean;
  workBuffer: Float32Array | undefined;
  osc: {
    miPhaseDelta: Interpolator;
    miShape: Interpolator;
    phaseAcc: number;
  };
  voicingAmp: {
    miGain: Interpolator;
    miDrive: Interpolator;
    miVolume: Interpolator;
  };
};

function osc_processSamples(bus: StateBus, buffer: Float32Array, len: number) {
  const { osc } = bus;
  const { miPhaseDelta, miShape } = osc;
  if (bus.gateTriggered) {
    osc.phaseAcc = 0;
    miPhaseDelta.reset();
    miShape.reset();
  }
  const sp = bus.parameters;
  const prPitch = clampValue(
    sp.oscPitch + bus.pitchEgValue * sp.pitchEgAmount,
    0,
    1,
  );
  const _phaseDelta = calcOscDelta(bus.noteNumber, prPitch, bus.sampleRate);
  miPhaseDelta.feed(_phaseDelta, len);
  miShape.feed(sp.oscShape, len);

  for (let i = 0; i < len; i++) {
    const phaseDelta = miPhaseDelta.advance();
    const prShape = miShape.advance();
    osc.phaseAcc = fracPart(osc.phaseAcc + phaseDelta);
    const y = getOscWaveformPdSaw(osc.phaseAcc, prShape);
    buffer[i] = y;
  }
}

function pitchEg_advance(bus: StateBus) {
  const sp = bus.parameters;
  const prWave = sp.pitchEgWave;
  const prTime = sp.pitchEgTime;
  const prShape = sp.pitchEgShape;
  const timeMax = power3(prTime) * 4;
  const timePos =
    timeMax === 0 ? 1 : clampValue(bus.currentTime / timeMax, 0, 1);
  const y = getEgWaveCurve(prWave, timePos, prShape);
  bus.pitchEgValue = y;
}

function ampEg_advance(bus: StateBus) {
  if (bus.gateOn) {
    const sp = bus.parameters;
    const prWave = sp.ampEgWave;
    const prTime = sp.ampEgTime;
    const prShape = sp.ampEgShape;
    const timeMax = power3(prTime) * 4;
    const timePos =
      timeMax === 0 ? 1 : clampValue(bus.currentTime / timeMax, 0, 1);
    const y = getEgWaveCurve(prWave, timePos, prShape);
    bus.ampEgValue = y;
    bus.ampToleLevel = y;
  } else {
    const releaseTimeMs = 20;
    const releaseTimeSec = releaseTimeMs / 1000;
    const t = clampValue(bus.currentTime / releaseTimeSec, 0, 1);
    const y = 1 - curveMapper.riseInvCosine(t);
    bus.ampEgValue = y * bus.ampToleLevel;
  }
}

function voicingAmp_processSamples(
  bus: StateBus,
  buffer: Float32Array,
  len: number,
) {
  const { miGain, miDrive, miVolume } = bus.voicingAmp;
  if (bus.gateTriggered) {
    miGain.reset();
    miDrive.reset();
    miVolume.reset();
  }
  const sp = bus.parameters;
  miGain.feed(bus.ampEgValue, len);
  miDrive.feed(sp.ampDrive, len);
  miVolume.feed(sp.volume, len);
  for (let i = 0; i < len; i++) {
    const gain = miGain.advance();
    const drive = miDrive.advance();
    const volume = miVolume.advance();
    let y = buffer[i] * gain;
    if (drive > 0) {
      y = tunableSigmoid(y * (1 + drive * 16), -drive * 0.95);
    }
    buffer[i] = applySoftClip(y) * volume;
  }
}

function createStateBus(): StateBus {
  return {
    parameters: createDefaultUnitParameters(),
    sampleRate: 0,
    ampEgValue: 0,
    pitchEgValue: 0,
    noteNumber: 60,
    currentTime: 0,
    gateOn: false,
    ampToleLevel: 0,
    gateTriggered: false,
    workBuffer: undefined,
    osc: {
      miPhaseDelta: createInterpolator(),
      miShape: createInterpolator(),
      phaseAcc: 0,
    },
    voicingAmp: {
      miGain: createInterpolator(),
      miDrive: createInterpolator(),
      miVolume: createInterpolator(),
    },
  };
}

export type KickSynthesizerDsp = {
  prepare(sampleRate: number, maxFrames: number): void;
  applyPreset(presetKey: KickPresetKey): void;
  setParameter(paramKey: KickParameterKey, value: number): void;
  processSamples(
    bufferL: Float32Array,
    bufferR: Float32Array,
    len: number,
  ): void;
  playTone(): void;
  stopTone(): void;
};

export function createKickSynthesizerDsp(): KickSynthesizerDsp {
  const bus = createStateBus();

  return {
    prepare(sampleRate, maxFrames) {
      bus.sampleRate = sampleRate;
      if (!(bus.workBuffer && bus.workBuffer.length === maxFrames)) {
        bus.workBuffer = new Float32Array(maxFrames);
      }
    },
    applyPreset(presetKey) {
      bus.parameters = kickPresets[presetKey];
    },
    setParameter(paramKey, value) {
      bus.parameters[paramKey] = value;
    },
    processSamples(bufferL, bufferR, len) {
      if (bus.sampleRate === 0 || !bus.workBuffer) return;
      const buffer = bus.workBuffer;
      buffer.fill(0);
      const timeLength = len / bus.sampleRate;
      pitchEg_advance(bus);
      ampEg_advance(bus);
      osc_processSamples(bus, buffer, len);
      voicingAmp_processSamples(bus, buffer, len);
      writeBuffer(bufferL, buffer, len);
      writeBuffer(bufferR, buffer, len);
      bus.currentTime += timeLength;
      bus.gateTriggered = false;
    },
    playTone() {
      bus.noteNumber = 32;
      bus.currentTime = 0;
      bus.gateOn = true;
      bus.gateTriggered = true;
    },
    stopTone() {
      bus.gateOn = false;
      bus.currentTime = 0;
    },
  };
}
