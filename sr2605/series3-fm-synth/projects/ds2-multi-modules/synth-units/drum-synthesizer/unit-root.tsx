import { DrumSynthesizerUnit } from "./interface";

export function createDrumSynthesizer(): DrumSynthesizerUnit {
  return {
    setupEngine(audioContext: AudioContext): AudioNode {
      const node = new GainNode(audioContext);
      return node;
    },
    renderUi() {
      return (
        <div class="w-[200px] h-[100px] flex-c border border-[#aaa]">
          drum synth
        </div>
      );
    },
  };
}
