import { createDefaultParameters, UnitParameters } from "@/parameters";

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
  return {
    initialize(audioContext: AudioContext): AudioNode {
      const node = new GainNode(audioContext);
      return node;
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
      console.log("noteOn", ch, noteNumber);
    },
    noteOff(ch: number, noteNumber: number) {
      console.log("noteOff", ch, noteNumber);
    },
  };
}
