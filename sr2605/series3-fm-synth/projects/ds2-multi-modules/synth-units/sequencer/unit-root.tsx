import { SequencerUnit } from "./interface";

export function createSequencer(): SequencerUnit {
  return {
    setupSequencerEngine(audioContext: AudioContext): void {},
    renderUi() {
      return (
        <div class="w-[200px] h-[100px] flex-c border border-[#aaa]">
          sequencer
        </div>
      );
    },
  };
}
