export type UnitEngineCommand =
  | { type: "noteOn"; channel: number; noteNumber: number; velocity: number }
  | { type: "noteOff"; channel: number; noteNumber: number };

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
export const unitEngine = createUnitEngine();
