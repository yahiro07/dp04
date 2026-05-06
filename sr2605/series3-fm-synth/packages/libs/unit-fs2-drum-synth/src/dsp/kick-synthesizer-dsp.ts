import { seqNumbers } from "@my/lib/ax/array-utils";
import {
  clampValue,
  fracPart,
  linearInterpolate,
  mapUnaryTo,
  power3,
} from "@my/lib/ax/number-utils";
import {
  applyBufferGainRms,
  clearBuffer,
  copyBuffer,
  writeBuffer,
} from "@my/lib/mo-dsp/buffer-functions";
import {
  curveMapper,
  mapExpCurve,
  tunableSigmoid,
} from "@my/lib/mo-dsp/curves";
import { createInterpolator, Interpolator } from "@my/lib/mo-dsp/interpolator";
import { getOscWaveformPdSaw } from "@my/lib/mo-dsp/pd-saw";
import {
  applySoftClip,
  applySoftClipBuffer,
} from "@my/lib/mo-dsp/soft-clip-shaper";
import { midiToFrequency } from "@my/lib/mo-dsp/synthesis-helper";
import {
  KickEgWave,
  KickParameterKey,
  KickParametersSuit,
  UnitParameters,
} from "@/base/parameters";
import {
  defaultKickPreset,
  KickPresetKey,
  kickPresets,
  snarePreset1,
} from "@/base/presets";

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

type VoiceState = {
  sampleRate: number;
  noteNumber: number;
  gateOn: boolean;
  gateOnUptime: number;
  gateTriggered: boolean;
  //
  ampEgValue: number;
  pitchEgValue: number;
  noiseEgValue: number;
  ampTopLevel: number;
  noiseTopLevel: number;
  //
  osc: {
    miPhaseDelta: Interpolator;
    miShape: Interpolator;
    phaseAcc: number;
  };
  voicingAmp: {
    miGain: Interpolator;
    miDrive: Interpolator;
    miVolume: Interpolator;
    miNoiseGain: Interpolator;
  };
};

function createVoiceState(): VoiceState {
  return {
    sampleRate: 0,
    ampEgValue: 0,
    pitchEgValue: 0,
    noiseEgValue: 0,
    noteNumber: 60,
    gateOnUptime: 0,
    gateOn: false,
    ampTopLevel: 0,
    noiseTopLevel: 0,
    gateTriggered: false,
    osc: {
      miPhaseDelta: createInterpolator(),
      miShape: createInterpolator(),
      phaseAcc: 0,
    },
    voicingAmp: {
      miGain: createInterpolator(),
      miDrive: createInterpolator(),
      miVolume: createInterpolator(),
      miNoiseGain: createInterpolator(),
    },
  };
}

type VoiceParameters = UnitParameters;

type SynthesisBus = {
  sampleRate: number;
  workBuffer: Float32Array | undefined;
  voiceParameters: VoiceParameters[];
  voices: VoiceState[];
};

function createSynthesisBus(): SynthesisBus {
  return {
    sampleRate: 0,
    workBuffer: undefined,
    voiceParameters: [defaultKickPreset, snarePreset1],
    voices: seqNumbers(2).map(createVoiceState),
  };
}

function osc_processSamples(
  voice: VoiceState,
  sp: VoiceParameters,
  buffer: Float32Array,
  len: number,
) {
  const { osc } = voice;
  const { miPhaseDelta, miShape } = osc;
  if (voice.gateTriggered) {
    osc.phaseAcc = 0;
    miPhaseDelta.reset();
    miShape.reset();
  }
  const prPitch = clampValue(
    sp.oscPitch + voice.pitchEgValue * sp.pitchEgAmount,
    0,
    1,
  );
  const _phaseDelta = calcOscDelta(voice.noteNumber, prPitch, voice.sampleRate);
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

function pitchEg_advance(voice: VoiceState, sp: VoiceParameters) {
  const prWave = sp.pitchEgWave;
  const prTime = sp.pitchEgTime;
  const prShape = sp.pitchEgShape;
  const timeMax = power3(prTime) * 4;
  const timePos =
    timeMax === 0 ? 1 : clampValue(voice.gateOnUptime / timeMax, 0, 1);
  const y = getEgWaveCurve(prWave, timePos, prShape);
  voice.pitchEgValue = y;
}

function ampEg_advance(voice: VoiceState, sp: VoiceParameters) {
  if (voice.gateOn) {
    const prWave = sp.ampEgWave;
    const prTime = sp.ampEgTime;
    const prShape = sp.ampEgShape;
    const timeMax = power3(prTime) * 4;
    const timePos =
      timeMax === 0 ? 1 : clampValue(voice.gateOnUptime / timeMax, 0, 1);
    const y = getEgWaveCurve(prWave, timePos, prShape);
    voice.ampEgValue = y;
    voice.ampTopLevel = y;
  } else {
    const releaseTimeMs = 20;
    const releaseTimeSec = releaseTimeMs / 1000;
    const t = clampValue(voice.gateOnUptime / releaseTimeSec, 0, 1);
    const y = 1 - curveMapper.riseInvCosine(t);
    voice.ampEgValue = y * voice.ampTopLevel;
  }
}

function noiseEg_advance(voice: VoiceState, sp: VoiceParameters) {
  if (voice.gateOn) {
    const prWave = sp.noiseEgWave;
    const prTime = sp.noiseEgTime;
    const prShape = sp.noiseEgShape;
    const timeMax = power3(prTime) * 4;
    const timePos =
      timeMax === 0 ? 1 : clampValue(voice.gateOnUptime / timeMax, 0, 1);
    const y = getEgWaveCurve(prWave, timePos, prShape);
    voice.noiseEgValue = y;
    voice.noiseTopLevel = y;
  } else {
    const releaseTimeMs = 20;
    const releaseTimeSec = releaseTimeMs / 1000;
    const t = clampValue(voice.gateOnUptime / releaseTimeSec, 0, 1);
    const y = 1 - curveMapper.riseInvCosine(t);
    voice.noiseEgValue = y * voice.noiseTopLevel;
  }
}

function voicingAmp_processSamples(
  voice: VoiceState,
  sp: VoiceParameters,
  buffer: Float32Array,
  len: number,
) {
  const { miGain, miDrive, miVolume } = voice.voicingAmp;
  const reset = voice.gateTriggered;
  miGain.feed(voice.ampEgValue, len, reset);
  miDrive.feed(sp.ampDrive, len, reset);
  miVolume.feed(sp.volume, len, reset);
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

function noiseOsc_processSamples(
  voice: VoiceState,
  sp: VoiceParameters,
  buffer: Float32Array,
  len: number,
) {
  const { miNoiseGain } = voice.voicingAmp;
  const reset = voice.gateTriggered;
  miNoiseGain.feed(voice.noiseEgValue, len, reset);
  const noiseVolume = sp.noiseVolume;
  for (let i = 0; i < len; i++) {
    const gain = miNoiseGain.advance();
    buffer[i] += (Math.random() * 2 - 1) * gain * noiseVolume;
  }
}

export type KickSynthesizerDsp = {
  prepare(sampleRate: number, maxFrames: number): void;
  applyPreset(ch: number, presetKey: KickPresetKey): void;
  setParameter<K extends KickParameterKey>(
    ch: number,
    paramKey: K,
    value: KickParametersSuit[K],
  ): void;
  processSamples(
    bufferL: Float32Array,
    bufferR: Float32Array,
    len: number,
  ): void;
  playTone(ch: number): void;
  stopTone(ch: number): void;
};

export function createKickSynthesizerDsp(): KickSynthesizerDsp {
  const bus = createSynthesisBus();

  return {
    prepare(sampleRate, maxFrames) {
      bus.sampleRate = sampleRate;
      if (!(bus.workBuffer && bus.workBuffer.length === maxFrames)) {
        bus.workBuffer = new Float32Array(maxFrames);
      }
      for (const voice of bus.voices) {
        voice.sampleRate = sampleRate;
      }
    },
    applyPreset(ch, presetKey) {
      bus.voiceParameters[ch] = kickPresets[presetKey];
    },
    setParameter(ch, paramKey, value) {
      bus.voiceParameters[ch][paramKey] = value;
    },
    processSamples(bufferL, bufferR, len) {
      if (bus.sampleRate === 0 || !bus.workBuffer) return;
      const timeLength = len / bus.sampleRate;
      clearBuffer(bufferL, len);
      for (let i = 0; i < bus.voices.length; i++) {
        const voice = bus.voices[i];
        const sp = bus.voiceParameters[i];
        const buffer = bus.workBuffer;
        clearBuffer(buffer, len);
        pitchEg_advance(voice, sp);
        ampEg_advance(voice, sp);
        noiseEg_advance(voice, sp);
        if (sp.oscOn) {
          osc_processSamples(voice, sp, buffer, len);
          voicingAmp_processSamples(voice, sp, buffer, len);
        }
        if (sp.noiseOn) {
          noiseOsc_processSamples(voice, sp, buffer, len);
        }
        writeBuffer(bufferL, buffer, len);

        voice.gateOnUptime += timeLength;
        voice.gateTriggered = false;
      }
      applyBufferGainRms(bufferL, len, bus.voices.length);
      applySoftClipBuffer(bufferL, len);
      copyBuffer(bufferR, bufferL, len);
    },
    playTone(ch) {
      const voice = bus.voices[ch];
      voice.noteNumber = 32;
      voice.gateOnUptime = 0;
      voice.gateOn = true;
      voice.gateTriggered = true;
    },
    stopTone(ch) {
      const voice = bus.voices[ch];
      voice.gateOn = false;
      voice.gateOnUptime = 0;
    },
  };
}
