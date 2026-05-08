import { linearInterpolate } from "@my/lib/ax/number-utils";
import { midiToFrequency } from "@my/lib/mo-dsp/synthesis-helper";
import {
  createDefaultParameters,
  OscWave,
  UnitParameters,
} from "@/core/parameters";

export type UnitEngineCommand =
  | { type: "noteOn"; channel: number; noteNumber: number; velocity: number }
  | { type: "noteOff"; channel: number; noteNumber: number };

export type UnitEngine = {
  initialize(audioContext: AudioContext): AudioNode;
  getParameters(ch: number): UnitParameters;
  setParameter<K extends keyof UnitParameters>(
    ch: number,
    key: K,
    value: UnitParameters[K],
  ): void;
  noteOn(ch: number, noteNumber: number): void;
  noteOff(ch: number, noteNumber: number): void;
};

export function createUnitEngine(): UnitEngine {
  const parameters = [
    createDefaultParameters(),
    { ...createDefaultParameters(), oscWave: OscWave.Rect },
  ];
  let outputNode: GainNode;

  const noteNodes: Record<string, OscillatorNode> = {};
  return {
    initialize(audioContext) {
      outputNode = new GainNode(audioContext);
      return outputNode;
    },
    getParameters(ch: number) {
      return { ...parameters[ch] };
    },
    setParameter(ch, key, value) {
      parameters[ch][key] = value;
    },
    noteOn(ch: number, noteNumber: number) {
      const sp = parameters[ch];
      const audioContext = outputNode.context;
      const relNote = linearInterpolate(sp.oscPitch, 0, 1, -12, 12);
      const wave = sp.oscWave;
      const freq = midiToFrequency(noteNumber + relNote);

      const oscillatorNode = audioContext.createOscillator();
      oscillatorNode.frequency.setValueAtTime(freq, audioContext.currentTime);
      oscillatorNode.type = oscWaveToOscillatorTypeMap[wave];
      oscillatorNode.connect(outputNode);
      oscillatorNode.start();
      const noteKey = `${ch}-${noteNumber}`;
      noteNodes[noteKey] = oscillatorNode;
    },
    noteOff(ch: number, noteNumber: number) {
      const noteKey = `${ch}-${noteNumber}`;
      const oscillatorNode = noteNodes[noteKey];
      if (oscillatorNode) {
        oscillatorNode.stop();
        delete noteNodes[noteKey];
      }
    },
  };
}

const oscWaveToOscillatorTypeMap = {
  [OscWave.Saw]: "sawtooth",
  [OscWave.Rect]: "square",
  [OscWave.Tri]: "triangle",
  [OscWave.Sine]: "sine",
} as const;
