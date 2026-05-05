import { OperatorParameters, OperatorWave } from "@ds1/base/parameters";
import { ModulationFlagBitPosition, Scene } from "@ds1/base/types";
import { ISynthesizerRoot } from "@ds1/dsp/api";
import { applyBufferGainRms, clearBuffer } from "@ds1/dsp/buffer-functions";
import { createDelayEffect } from "@ds1/dsp/delay-effect";
import { getEnvelopeLevelADSR } from "@ds1/dsp/envelope-func";
import { createReverbSchroeder } from "@ds1/dsp/reverb-schroeder";
import { basicWaves, getOscWaveformPdSaw } from "@ds1/dsp/waveforms";
import { createDefaultScene } from "@ds1/machine/default-scene";
import { seqNumbers } from "@lib/ax/array-utils";
import { linerInterpolate, power2 } from "@lib/ax/number-utils";

const configs = {
  numVoices: 6,
};

type AudioFrame = {
  bufferL: Float32Array;
  bufferR: Float32Array;
  length: number;
};

type OperatorState = {
  phase: number;
  phaseInc: number;
  output: number;
  modSourceBitFlags: number;
  isCarrier: boolean;
  egLevel: number;
  egGateOnLastLevel: number;
  sampleHoldValue: number;
  sampleHoldCounter: number;
};

type VoiceState = {
  noteNumber: number;
  gateActive: boolean;
  gateOnUptime: number; //seconds
  gateOffUptime: number; //seconds
  gateTriggered: boolean;
  operators: OperatorState[]; //[4]
  processingActive: boolean;
};

type RenderingContext = {
  scene: Scene;
  sampleRate: number;
};
type SynthesisBus = {
  voices: VoiceState[]; //[6]
};

function createOperatorState(): OperatorState {
  return {
    phase: 0,
    phaseInc: 0,
    output: 0,
    modSourceBitFlags: 0,
    isCarrier: false,
    egLevel: 0,
    egGateOnLastLevel: 0,
    sampleHoldValue: 0,
    sampleHoldCounter: 0,
  };
}

function createVoiceState(): VoiceState {
  return {
    noteNumber: 0,
    gateActive: false,
    gateOnUptime: 0,
    gateOffUptime: 0,
    gateTriggered: false,
    operators: seqNumbers(4).map(createOperatorState),
    processingActive: false,
  };
}

function createRenderingContext(): RenderingContext {
  return {
    scene: createDefaultScene(),
    sampleRate: 0,
  };
}

function createSynthesisBus(): SynthesisBus {
  return {
    voices: seqNumbers(configs.numVoices).map(createVoiceState),
  };
}

function midiToFrequency(noteNumber: number): number {
  return 440 * 2 ** ((noteNumber - 69) / 12);
}

function voice_wireOperators(rc: RenderingContext, voice: VoiceState) {
  const ops = voice.operators;
  const mf = rc.scene.modulationFlags;
  const bp = ModulationFlagBitPosition;

  const modEn01 = mf & (1 << bp.mod01) ? 1 : 0;
  const modEn12 = mf & (1 << bp.mod12) ? 1 : 0;
  const modEn23 = mf & (1 << bp.mod23) ? 1 : 0;
  const modEn02 = mf & (1 << bp.mod02) ? 1 : 0;
  const modEn13 = mf & (1 << bp.mod13) ? 1 : 0;
  const modEn03 = mf & (1 << bp.mod03) ? 1 : 0;

  for (let i = 0; i < 4; i++) {
    const op = ops[i];
    if (i === 0) {
      op.modSourceBitFlags = 0;
      op.isCarrier = !(modEn01 || modEn02 || modEn03);
    } else if (i === 1) {
      op.modSourceBitFlags = modEn01 << 0;
      op.isCarrier = !(modEn12 || modEn13);
    } else if (i === 2) {
      op.modSourceBitFlags = (modEn02 << 0) | (modEn12 << 1);
      op.isCarrier = !modEn23;
    } else if (i === 3) {
      op.modSourceBitFlags = (modEn03 << 0) | (modEn13 << 1) | (modEn23 << 2);
      op.isCarrier = true;
    }
  }
}

function operator_updateDelta(
  rc: RenderingContext,
  voice: VoiceState,
  opIndex: number,
) {
  const sp = rc.scene.operatorParameters[opIndex];
  const op = voice.operators[opIndex];
  const det = power2(sp.fine) * Math.sign(sp.fine);
  const noteNumber = voice.noteNumber + sp.octave * 12 + sp.semi + det;
  const freq = midiToFrequency(noteNumber) * sp.ratio;
  op.phaseInc = freq / rc.sampleRate;
}

const operatorEgConfig = {
  attackMaxSec: 3,
  decayMaxSec: 3,
  releaseMaxSec: 3,
};

function operator_calculateEgLevel(
  rc: RenderingContext,
  voice: VoiceState,
  opIndex: number,
): number {
  const op = voice.operators[opIndex];
  const sp = rc.scene.operatorParameters[opIndex];
  const egParams = {
    attack: sp.attack,
    decay: sp.decay,
    sustain: sp.sustain,
    release: sp.release,
  };
  if (voice.gateActive) {
    return getEnvelopeLevelADSR(
      voice.gateOnUptime,
      egParams,
      operatorEgConfig,
      "gateOn",
      0,
    );
  } else {
    return getEnvelopeLevelADSR(
      voice.gateOffUptime,
      egParams,
      operatorEgConfig,
      "gateOff",
      op.egGateOnLastLevel,
    );
  }
}

function operator_updateEg(
  rc: RenderingContext,
  voice: VoiceState,
  opIndex: number,
) {
  const op = voice.operators[opIndex];
  op.egLevel = operator_calculateEgLevel(rc, voice, opIndex);
  if (voice.gateActive) {
    op.egGateOnLastLevel = op.egLevel;
  }
}

function getWaveformSample(
  op: OperatorState,
  phase: number,
  wave: OperatorWave,
  prShape: number,
): number {
  if (wave === OperatorWave.Sine || wave === OperatorWave.SineCSF) {
    return basicWaves.sine(phase);
  } else if (wave === OperatorWave.Noise) {
    return op.sampleHoldValue;
  } else if (wave === OperatorWave.Saw) {
    return basicWaves.saw(phase);
  } else if (wave === OperatorWave.Square) {
    return basicWaves.square(phase, prShape);
  } else if (wave === OperatorWave.Triangle) {
    return basicWaves.triangle(phase);
  } else if (wave === OperatorWave.PdSaw) {
    return getOscWaveformPdSaw(phase, prShape, false);
  } else {
    return 0;
  }
}

function operator_updateSampleHold(
  op: OperatorState,
  opParams: OperatorParameters,
) {
  if (opParams.wave === OperatorWave.Noise) {
    op.sampleHoldCounter++;
    const sampleHoldInterval = (power2(opParams.feedback) * 200) >>> 0;
    if (op.sampleHoldCounter >= sampleHoldInterval) {
      op.sampleHoldValue = Math.random() * 2 - 1;
      op.sampleHoldCounter = 0;
    }
  }
}

function operator_processOneStep(
  rc: RenderingContext,
  voice: VoiceState,
  opIndex: number,
) {
  const ops = voice.operators;
  const op = ops[opIndex];
  const sp = rc.scene.operatorParameters[opIndex];
  const gain = sp.active ? power2(sp.level) : 0;
  const modSourceBf = op.modSourceBitFlags;

  operator_updateSampleHold(op, sp);

  if (voice.gateTriggered) {
    op.phase = 0;
  }

  const unisonApplied = op.isCarrier && sp.unisonOn;
  if (!unisonApplied) {
    op.phase += op.phaseInc;
    op.phase -= Math.floor(op.phase);

    let phase =
      op.phase +
      (modSourceBf & (1 << 0) ? ops[0].output : 0) +
      (modSourceBf & (1 << 1) ? ops[1].output : 0) +
      (modSourceBf & (1 << 2) ? ops[2].output : 0);
    if (sp.feedback > 0) {
      phase += op.output * power2(sp.feedback);
    }
    phase -= Math.floor(phase);
    const y =
      getWaveformSample(op, phase, sp.wave, sp.shape) * op.egLevel * gain;
    op.output = y;
  } else {
    op.phase += op.phaseInc;
    let basePhase =
      op.phase +
      (modSourceBf & (1 << 0) ? ops[0].output : 0) +
      (modSourceBf & (1 << 1) ? ops[1].output : 0) +
      (modSourceBf & (1 << 2) ? ops[2].output : 0);
    if (sp.feedback > 0) {
      basePhase += op.output * power2(sp.feedback);
    }
    const n = sp.unisonNum;
    let y = 0;
    for (let i = 0; i < n; i++) {
      const w = linerInterpolate(i, 0, n - 1, -1, 1);
      let phase = basePhase * (1 + sp.unisonDetune * 0.03 * w);
      phase -= Math.floor(phase);
      y += getWaveformSample(op, phase, sp.wave, sp.shape);
    }
    y /= n;
    op.output = y * op.egLevel * gain;
  }
}

function findNextVoice(voices: VoiceState[]) {
  // find the voice that is inactive and has the highest getOffUptime value
  // i.e., the one that has been silent the longest
  let index = -1;
  for (let i = 0; i < voices.length; i++) {
    if (!voices[i].gateActive) {
      if (index === -1) {
        index = i;
      } else {
        if (voices[i].gateOffUptime > voices[index].gateOffUptime) {
          index = i;
        }
      }
    }
  }
  if (index !== -1) {
    return voices[index];
  }
  // if all voices are active
  // find the voice with the highest getOnUptime value
  // i.e., the one that has been playing the longest
  index = 0;
  for (let i = 0; i < voices.length; i++) {
    if (voices[i].gateOnUptime > voices[index].gateOnUptime) {
      index = i;
    }
  }
  return voices[index];
}

function voice_noteOn(
  voice: VoiceState,
  noteNumber: number,
  _velocity: number,
) {
  voice.noteNumber = noteNumber;
  voice.gateActive = true;
  voice.gateOnUptime = 0;
  voice.gateTriggered = true;
  voice.processingActive = true;
}

function voice_noteOff(voice: VoiceState) {
  voice.gateActive = false;
  voice.gateOffUptime = 0;
}

function voice_processAudio(
  rc: RenderingContext,
  audioFrame: AudioFrame,
  voice: VoiceState,
) {
  voice_wireOperators(rc, voice);
  for (let j = 0; j < 4; j++) {
    operator_updateDelta(rc, voice, j);
    operator_updateEg(rc, voice, j);
  }
  const ops = voice.operators;
  for (let i = 0; i < audioFrame.length; i++) {
    for (let j = 0; j < 4; j++) {
      operator_processOneStep(rc, voice, j);
    }
    const y =
      ((ops[0].isCarrier ? ops[0].output : 0) +
        (ops[1].isCarrier ? ops[1].output : 0) +
        (ops[2].isCarrier ? ops[2].output : 0) +
        (ops[3].isCarrier ? ops[3].output : 0)) /
      4;
    audioFrame.bufferL[i] += y;
    audioFrame.bufferR[i] += y;
  }
  const timeElapsed = audioFrame.length / rc.sampleRate;
  voice.gateOnUptime += timeElapsed;
  if (!voice.gateActive) {
    voice.gateOffUptime += timeElapsed;
  }
  voice.gateTriggered = false;
  if (!voice.gateActive && voice.processingActive) {
    let egLevel = 0;
    for (const op of voice.operators) {
      egLevel = Math.max(egLevel, op.egLevel);
    }
    //todo: check actual level if delay or reverb are added later
    if (egLevel < 1e-3) {
      voice.processingActive = false;
    }
  }
}

export function createSynthesizerRoot(): ISynthesizerRoot {
  const rc = createRenderingContext();
  const bus = createSynthesisBus();
  const delayL = createDelayEffect();
  const delayR = createDelayEffect();
  const reverbL = createReverbSchroeder();
  const reverbR = createReverbSchroeder();
  return {
    prepareProcessing(sampleRate, _maxFrameLength) {
      rc.sampleRate = sampleRate;
      delayL.prepare(sampleRate);
      delayR.prepare(sampleRate);
      reverbL.prepare(sampleRate);
      reverbR.prepare(sampleRate);
    },
    setParameter(_id, _value) {},
    setOperatorParameter(operatorIndex, paramKey, value) {
      (rc.scene.operatorParameters[operatorIndex][paramKey] as
        | number
        | boolean) = value;
    },
    setCommonParameter(paramKey, value) {
      (rc.scene.commonParameters[paramKey] as number | boolean) = value;
    },
    setModulationFlags(flags) {
      rc.scene.modulationFlags = flags;
    },
    noteOn(noteNumber, velocity) {
      const nextVoice = findNextVoice(bus.voices);
      voice_noteOn(nextVoice, noteNumber, velocity);
    },
    noteOff(noteNumber) {
      for (const voice of bus.voices) {
        if (voice.gateActive && voice.noteNumber === noteNumber) {
          voice_noteOff(voice);
        }
      }
    },
    processAudio(bufferL, bufferR, frames) {
      clearBuffer(bufferL);
      clearBuffer(bufferR);
      const audioFrame: AudioFrame = {
        bufferL,
        bufferR,
        length: frames,
      };
      for (const voice of bus.voices) {
        if (!voice.processingActive) continue;
        voice_processAudio(rc, audioFrame, voice);
      }
      applyBufferGainRms(bufferL, configs.numVoices);
      applyBufferGainRms(bufferR, configs.numVoices);

      const cp = rc.scene.commonParameters;
      if (cp.delayEnabled) {
        delayL.processSamples(
          bufferL,
          frames,
          cp.delayTime,
          cp.delayFeed,
          cp.delayMix,
        );
        delayR.processSamples(
          bufferR,
          frames,
          cp.delayTime,
          cp.delayFeed,
          cp.delayMix,
        );
      }
      if (cp.reverbEnabled) {
        reverbL.processSamples(bufferL, frames, cp.reverbTime, cp.reverbMix);
        reverbR.processSamples(bufferR, frames, cp.reverbTime, cp.reverbMix);
      }
    },
    applyCommand(_id, _value) {},
  };
}
