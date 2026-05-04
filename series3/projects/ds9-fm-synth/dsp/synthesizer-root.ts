import { ModulationFlagBitPosition, Scene } from "@ds9/base/types";
import { ISynthesizerRoot } from "@ds9/dsp/api";
import { getEnvelopeLevelADSR } from "@ds9/dsp/envelope-func";
import { getWaveformSample } from "@ds9/dsp/waveform";
import { createDefaultScene } from "@ds9/machine/default-scene";
import { seqNumbers } from "@lib/ax/array-utils";
import { power2 } from "@lib/ax/number-utils";

type SynthesisBus = {
  scene: Scene;
  noteNumber: number;
  noteGate: boolean;
  sampleRate: number;
  operatorStates: OperatorState[];
  modulationFlags: number;
  gateOnUptime: number; //seconds
  gateOffUptime: number; //seconds
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

function createBus(): SynthesisBus {
  return {
    scene: createDefaultScene(),
    noteNumber: 60,
    noteGate: false,
    sampleRate: 0,
    operatorStates: seqNumbers(4).map(createOperatorState),
    modulationFlags: 0,
    gateOnUptime: 0,
    gateOffUptime: 0,
  };
}

function midiToFrequency(noteNumber: number): number {
  return 440 * 2 ** ((noteNumber - 69) / 12);
}

function wireOperators(bus: SynthesisBus) {
  const ops = bus.operatorStates;
  const mf = bus.modulationFlags;
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

function updateOperatorDelta(bus: SynthesisBus, operatorIndex: number) {
  const sp = bus.scene.operatorParameters[operatorIndex];
  const es = bus.operatorStates[operatorIndex];
  const det = power2(sp.fine) * Math.sign(sp.fine);
  const noteNumber = bus.noteNumber + sp.octave * 12 + sp.semi + det;
  const freq = midiToFrequency(noteNumber) * sp.ratio;
  es.phaseInc = freq / bus.sampleRate;
}

const operatorEgConfig = {
  attackMaxSec: 3,
  decayMaxSec: 3,
  releaseMaxSec: 3,
};

function calculateOperatorEgLevel(
  bus: SynthesisBus,
  operatorIndex: number,
): number {
  const op = bus.operatorStates[operatorIndex];
  const sp = bus.scene.operatorParameters[operatorIndex];
  const egParams = {
    attack: sp.attack,
    decay: sp.decay,
    sustain: sp.sustain,
    release: sp.release,
  };
  if (bus.noteGate) {
    return getEnvelopeLevelADSR(
      bus.gateOnUptime,
      egParams,
      operatorEgConfig,
      "gateOn",
      0,
    );
  } else {
    return getEnvelopeLevelADSR(
      bus.gateOffUptime,
      egParams,
      operatorEgConfig,
      "gateOff",
      op.egGateOnLastLevel,
    );
  }
}

function updateOperatorEg(bus: SynthesisBus, operatorIndex: number) {
  const op = bus.operatorStates[operatorIndex];
  op.egLevel = calculateOperatorEgLevel(bus, operatorIndex);
  if (bus.noteGate) {
    op.egGateOnLastLevel = op.egLevel;
  }
}

function processOperator(bus: SynthesisBus, operatorIndex: number) {
  const op = bus.operatorStates[operatorIndex];
  const sp = bus.scene.operatorParameters[operatorIndex];
  const gain = sp.active ? power2(sp.level) : 0;

  op.phase += op.phaseInc;
  op.phase -= Math.floor(op.phase);

  let phase =
    op.phase +
    op.modSourceOperatorA.output +
    op.modSourceOperatorB.output +
    op.modSourceOperatorC.output;
  phase -= Math.floor(phase);
  const y = getWaveformSample(phase, sp.wave) * op.egLevel * gain;
  op.output = y;
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
      bus.modulationFlags = flags;
    },
    noteOn(noteNumber, _velocity) {
      bus.noteNumber = noteNumber;
      bus.noteGate = true;
      bus.gateOnUptime = 0;
    },
    noteOff(noteNumber) {
      if (noteNumber === bus.noteNumber && bus.noteGate) {
        bus.noteGate = false;
        bus.gateOffUptime = 0;
      }
    },
    processAudio(bufferL, bufferR, frames) {
      if (bus.sampleRate === 0) return;
      wireOperators(bus);
      for (let j = 0; j < 4; j++) {
        updateOperatorDelta(bus, j);
        updateOperatorEg(bus, j);
      }
      const ops = bus.operatorStates;
      for (let i = 0; i < frames; i++) {
        for (let j = 0; j < 4; j++) {
          processOperator(bus, j);
        }
        const y =
          ((ops[0].isCarrier ? ops[0].output : 0) +
            (ops[1].isCarrier ? ops[1].output : 0) +
            (ops[2].isCarrier ? ops[2].output : 0) +
            (ops[3].isCarrier ? ops[3].output : 0)) /
          4;
        bufferL[i] = y;
        bufferR[i] = y;
      }
      const timeElapsed = frames / bus.sampleRate;
      bus.gateOnUptime += timeElapsed;
      if (!bus.noteGate) {
        bus.gateOffUptime += timeElapsed;
      }
    },
    applyCommand(_id, _value) {},
  };
}
