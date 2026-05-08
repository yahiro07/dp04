import { linearInterpolate } from "@my/lib/ax/number-utils";
import { midiToFrequency } from "@my/lib/mo-dsp/synthesis-helper";
import { createDefaultParameters, OscWave, UnitParameters } from "@/parameters";

export type UnitEngineCommand =
  | { type: "noteOn"; channel: number; noteNumber: number; velocity: number }
  | { type: "noteOff"; channel: number; noteNumber: number };

export type UnitEngine = {
  initialize(audioContext: AudioContext): AudioNode;
  getParameters(): UnitParameters;
  setParameter<K extends keyof UnitParameters>(
    key: K,
    value: UnitParameters[K],
  ): void;
  noteOn(ch: number, noteNumber: number): void;
  noteOff(ch: number, noteNumber: number): void;
};

export function createUnitEngine(): UnitEngine {
  const parameters = createDefaultParameters();
  let outputNode: GainNode;

  const noteNodes: Record<string, OscillatorNode> = {};
  return {
    initialize(audioContext: AudioContext): AudioNode {
      outputNode = new GainNode(audioContext);
      return outputNode;
    },
    getParameters(): UnitParameters {
      return parameters;
    },
    setParameter<K extends keyof UnitParameters>(
      key: K,
      value: UnitParameters[K],
    ) {
      parameters[key] = value;
    },
    noteOn(ch: number, noteNumber: number) {
      const audioContext = outputNode.context;
      const relNote = linearInterpolate(parameters.oscPitch, 0, 1, -12, 12);
      const wave = parameters.oscWave;
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
