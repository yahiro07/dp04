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

export enum KickEgWave {
  ds,
  d,
  pd,
}

export type KickParametersSuit = {
  oscPitch: number;
  oscShape: number;
  pitchEgWave: KickEgWave;
  pitchEgTime: number;
  pitchEgShape: number;
  pitchEgAmount: number;
  ampEgWave: KickEgWave;
  ampEgTime: number;
  ampEgShape: number;
  ampDrive: number;
  volume: number;
};

export enum KickPresetKey {
  kick1,
  kick2,
  kick3,
  kick4,
  kick5,
}

const kickPresets = {
  [KickPresetKey.kick1]: {
    oscPitch: 0.44,
    oscShape: 0.3,
    pitchEgWave: KickEgWave.ds,
    pitchEgTime: 0.3,
    pitchEgShape: 0,
    pitchEgAmount: 0.53,
    ampEgWave: KickEgWave.d,
    ampEgTime: 0.63,
    ampEgShape: 0.6,
    ampDrive: 0.05,
    volume: 0.66,
  },
  [KickPresetKey.kick2]: {
    oscPitch: 0.32,
    oscShape: 0.5,
    pitchEgWave: KickEgWave.ds,
    pitchEgTime: 0.23,
    pitchEgShape: 0.21,
    pitchEgAmount: 0.74,
    ampEgWave: KickEgWave.d,
    ampEgTime: 0.52,
    ampEgShape: 0.38,
    ampDrive: 0.28,
    volume: 1,
  },
  [KickPresetKey.kick3]: {
    oscPitch: 0.34,
    oscShape: 0.61,
    pitchEgWave: KickEgWave.ds,
    pitchEgTime: 0.26,
    pitchEgShape: 0.12,
    pitchEgAmount: 0.74,
    ampEgWave: KickEgWave.pd,
    ampEgTime: 0.41,
    ampEgShape: 0.39,
    ampDrive: 0,
    volume: 0.61,
  },
  [KickPresetKey.kick4]: {
    oscPitch: 0.32,
    oscShape: 0.32,
    pitchEgWave: KickEgWave.ds,
    pitchEgTime: 0.29,
    pitchEgShape: 0.23,
    pitchEgAmount: 0.68,
    ampEgWave: KickEgWave.pd,
    ampEgTime: 0.55,
    ampEgShape: 0.51,
    ampDrive: 0,
    volume: 0.46,
  },
  [KickPresetKey.kick5]: {
    oscPitch: 0.34,
    oscShape: 0.78,
    pitchEgWave: KickEgWave.ds,
    pitchEgTime: 0.42,
    pitchEgShape: 0.07,
    pitchEgAmount: 0.73,
    ampEgWave: KickEgWave.d,
    ampEgTime: 0.6,
    ampEgShape: 0.38,
    ampDrive: 0.21,
    volume: 0.24,
  },
} satisfies Record<KickPresetKey, KickParametersSuit>;

const defaultKickParameters = kickPresets[KickPresetKey.kick1];

function getEgWaveCurve(wave: KickEgWave, x: number, w: number) {
  if (wave === KickEgWave.ds) {
    const base = w;
    return base + (1 - base) * mapExpCurve(1 - x);
  } else if (wave === KickEgWave.d) {
    const scaler = mapUnaryTo(1 - w, 1, 16);
    return mapExpCurve(1 - x, scaler);
  } else if (wave === KickEgWave.pd) {
    if (x <= w) {
      return 1;
    } else {
      const u = linearInterpolate(x, w, 1, 1, 0);
      return u * u;
    }
  }
  return 0;
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

export function createStateBus(): StateBus {
  return {
    parameters: defaultKickParameters,
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

export class KickSynth {
  private bus: StateBus = createStateBus();

  prepare(sampleRate: number, maxFrames: number) {
    this.bus.sampleRate = sampleRate;
    if (!(this.bus.workBuffer && this.bus.workBuffer.length === maxFrames)) {
      this.bus.workBuffer = new Float32Array(maxFrames);
    }
  }

  applyPreset(presetKey: KickPresetKey) {
    this.bus.parameters = kickPresets[presetKey];
  }

  processSamples(destBuffer: Float32Array, len: number) {
    if (this.bus.sampleRate === 0 || !this.bus.workBuffer) return;
    const buffer = this.bus.workBuffer;
    buffer.fill(0);
    const timeLength = len / this.bus.sampleRate;
    pitchEg_advance(this.bus);
    ampEg_advance(this.bus);
    osc_processSamples(this.bus, buffer, len);
    voicingAmp_processSamples(this.bus, buffer, len);
    writeBuffer(destBuffer, buffer, len);
    this.bus.currentTime += timeLength;
    this.bus.gateTriggered = false;
  }

  playTone() {
    this.bus.noteNumber = 32;
    this.bus.currentTime = 0;
    this.bus.gateOn = true;
    this.bus.gateTriggered = true;
  }

  stopTone() {
    this.bus.gateOn = false;
    this.bus.currentTime = 0;
  }
}
