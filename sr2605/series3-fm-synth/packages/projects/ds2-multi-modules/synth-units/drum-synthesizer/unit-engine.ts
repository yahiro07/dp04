import { DrumKitToneId } from "@/synth-units/drum-synthesizer/types";

export type UnitEngineCommand = { type: "playTone"; toneId: DrumKitToneId };

export type UnitEngine = {
  initialize(audioContext: AudioContext): AudioNode;
  handleCommand(command: UnitEngineCommand): void;
};

export function createUnitEngine(): UnitEngine {
  return {
    initialize(audioContext: AudioContext): AudioNode {
      const node = new GainNode(audioContext);
      return node;
    },
    handleCommand(command: UnitEngineCommand): void {
      console.log(command);
    },
  };
}
