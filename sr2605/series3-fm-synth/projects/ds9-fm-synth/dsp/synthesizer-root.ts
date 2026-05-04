import { ModulationFlagBitPosition, Scene } from "@ds9/base/types";
import { ISynthesizerRoot } from "@ds9/dsp/api";
import { applyBufferGainRms, clearBuffer } from "@ds9/dsp/buffer-functions";
import { getEnvelopeLevelADSR } from "@ds9/dsp/envelope-func";
import { getWaveformSample } from "@ds9/dsp/waveform";
import { createDefaultScene } from "@ds9/machine/default-scene";
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
  //if ported to c++, use pointer for better performance
  //float* modSourceOperatorOutputs;
  modSourceOperatorA: OperatorState;
  modSourceOperatorB: OperatorState;
  modSourceOperatorC: OperatorState;
  isCarrier: boolean;
  egLevel: number;
  egGateOnLastLevel: number;
};

type VoiceState = {
  noteNumber: number;
  gateActive: boolean;
  gateOnUptime: number; //seconds
  gateOffUptime: number; //seconds
  gateTriggered: boolean;
  operatorStates: OperatorState[];
};

type SynthesisBus = {
  scene: Scene;
  sampleRate: number;
  voices: VoiceState[];
};

const dummyZeroOperatorState: OperatorState = {
  phase: 0,
  phaseInc: 0,
  output: 0,
  modSourceOperatorA: null!, //dummy, not accessed
  modSourceOperatorB: null!, //dummy, not accessed
  modSourceOperatorC: null!, //dummy, not accessed
  isCarrier: false,
  egLevel: 0,
  egGateOnLastLevel: 0,
};

function createOperatorState(): OperatorState {
  return {
    phase: 0,
    phaseInc: 0,
    output: 0,
    modSourceOperatorA: dummyZeroOperatorState,
    modSourceOperatorB: dummyZeroOperatorState,
    modSourceOperatorC: dummyZeroOperatorState,
    isCarrier: false,
    egLevel: 0,
    egGateOnLastLevel: 0,
  };
}

function createVoiceState(): VoiceState {
  return {
    noteNumber: 0,
    gateActive: false,
    gateOnUptime: 0,
    gateOffUptime: 0,
    gateTriggered: false,
    operatorStates: seqNumbers(4).map(createOperatorState),
  };
}

function createBus(): SynthesisBus {
  return {
    scene: createDefaultScene(),
    sampleRate: 0,
    voices: seqNumbers(configs.numVoices).map(createVoiceState),
  };
}

function midiToFrequency(noteNumber: number): number {
  return 440 * 2 ** ((noteNumber - 69) / 12);
}

function voice_wireOperators(bus: SynthesisBus, voice: VoiceState) {
  const ops = voice.operatorStates;
  const mf = bus.scene.modulationFlags;
  const bp = ModulationFlagBitPosition;
  const opDummy = dummyZeroOperatorState;

  const modEn01 = mf & bp.mod01;
  const modEn12 = mf & bp.mod12;
  const modEn23 = mf & bp.mod23;
  const modEn02 = mf & bp.mod02;
  const modEn13 = mf & bp.mod13;
  const modEn03 = mf & bp.mod03;

  for (let i = 0; i < 4; i++) {
    const op = ops[i];
    if (i === 0) {
      op.modSourceOperatorA = opDummy;
      op.modSourceOperatorB = opDummy;
      op.modSourceOperatorC = opDummy;
      op.isCarrier = !(modEn01 || modEn02 || modEn03);
    } else if (i === 1) {
      op.modSourceOperatorA = modEn01 ? ops[0] : opDummy;
      op.modSourceOperatorB = opDummy;
      op.modSourceOperatorC = opDummy;
      op.isCarrier = !(modEn12 || modEn13);
    } else if (i === 2) {
      op.modSourceOperatorA = modEn02 ? ops[0] : opDummy;
      op.modSourceOperatorB = modEn12 ? ops[1] : opDummy;
      op.modSourceOperatorC = opDummy;
      op.isCarrier = !modEn23;
    } else if (i === 3) {
      op.modSourceOperatorA = modEn03 ? ops[0] : opDummy;
      op.modSourceOperatorB = modEn13 ? ops[1] : opDummy;
      op.modSourceOperatorC = modEn23 ? ops[2] : opDummy;
      op.isCarrier = true;
    }
  }
}

function operator_updateDelta(
  bus: SynthesisBus,
  voice: VoiceState,
  operatorIndex: number,
) {
  const sp = bus.scene.operatorParameters[operatorIndex];
  const es = voice.operatorStates[operatorIndex];
  const det = power2(sp.fine) * Math.sign(sp.fine);
  const noteNumber = voice.noteNumber + sp.octave * 12 + sp.semi + det;
  const freq = midiToFrequency(noteNumber) * sp.ratio;
  es.phaseInc = freq / bus.sampleRate;
}

const operatorEgConfig = {
  attackMaxSec: 3,
  decayMaxSec: 3,
  releaseMaxSec: 3,
};

function operator_calculateEgLevel(
  bus: SynthesisBus,
  voice: VoiceState,
  operatorIndex: number,
): number {
  const op = voice.operatorStates[operatorIndex];
  const sp = bus.scene.operatorParameters[operatorIndex];
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
  bus: SynthesisBus,
  voice: VoiceState,
  operatorIndex: number,
) {
  const op = voice.operatorStates[operatorIndex];
  op.egLevel = operator_calculateEgLevel(bus, voice, operatorIndex);
  if (voice.gateActive) {
    op.egGateOnLastLevel = op.egLevel;
  }
}

function operator_processOneStep(
  bus: SynthesisBus,
  voice: VoiceState,
  operatorIndex: number,
) {
  const op = voice.operatorStates[operatorIndex];
  const sp = bus.scene.operatorParameters[operatorIndex];
  const gain = sp.active ? power2(sp.level) : 0;

  if (voice.gateTriggered) {
    op.phase = 0;
  }

  if (!sp.unisonOn) {
    op.phase += op.phaseInc;
    op.phase -= Math.floor(op.phase);

    let phase =
      op.phase +
      op.modSourceOperatorA.output +
      op.modSourceOperatorB.output +
      op.modSourceOperatorC.output;
    if (sp.feedback > 0) {
      phase += op.output * power2(sp.feedback);
    }
    phase -= Math.floor(phase);
    const y = getWaveformSample(phase, sp.wave) * op.egLevel * gain;
    op.output = y;
  } else {
    op.phase += op.phaseInc;
    let basePhase =
      op.phase +
      op.modSourceOperatorA.output +
      op.modSourceOperatorB.output +
      op.modSourceOperatorC.output;
    if (sp.feedback > 0) {
      basePhase += op.output * power2(sp.feedback);
    }
    const n = sp.unisonNum;
    let y = 0;
    for (let i = 0; i < n; i++) {
      const w = linerInterpolate(i, 0, n - 1, -1, 1);
      let phase = basePhase * (1 + sp.unisonDetune * 0.03 * w);
      phase -= Math.floor(phase);
      y += getWaveformSample(phase, sp.wave);
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
}

function voice_noteOff(voice: VoiceState) {
  voice.gateActive = false;
  voice.gateOffUptime = 0;
}

function voice_processAudio(
  audioFrame: AudioFrame,
  bus: SynthesisBus,
  voice: VoiceState,
) {
  voice_wireOperators(bus, voice);
  for (let j = 0; j < 4; j++) {
    operator_updateDelta(bus, voice, j);
    operator_updateEg(bus, voice, j);
  }
  const ops = voice.operatorStates;
  for (let i = 0; i < audioFrame.length; i++) {
    for (let j = 0; j < 4; j++) {
      operator_processOneStep(bus, voice, j);
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
  const timeElapsed = audioFrame.length / bus.sampleRate;
  voice.gateOnUptime += timeElapsed;
  if (!voice.gateActive) {
    voice.gateOffUptime += timeElapsed;
  }
  voice.gateTriggered = false;
}

export function createSynthesizerRoot(): ISynthesizerRoot {
  const bus = createBus();
  return {
    prepareProcessing(_sampleRate, _maxFrameLength) {
      bus.sampleRate = _sampleRate;
    },
    setParameter(_id, _value) {},
    setOperatorParameter(operatorIndex, paramKey, value) {
      (bus.scene.operatorParameters[operatorIndex][paramKey] as
        | number
        | boolean) = value;
    },
    setModulationFlags(flags) {
      bus.scene.modulationFlags = flags;
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
        voice_processAudio(audioFrame, bus, voice);
      }
      applyBufferGainRms(bufferL, configs.numVoices);
      applyBufferGainRms(bufferR, configs.numVoices);
    },
    applyCommand(_id, _value) {},
  };
}
