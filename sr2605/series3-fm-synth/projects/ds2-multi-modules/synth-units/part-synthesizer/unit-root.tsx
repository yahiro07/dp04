import { PartSynthesizerUnit } from "@ds2/synth-units/part-synthesizer/interface";

export function createPartSynthesizer(
  audioContext: AudioContext,
): PartSynthesizerUnit {
  return {
    setupEngine(): AudioNode {
      const node = new GainNode(audioContext);
      return node;
    },
    renderUi() {
      return (
        <div class="w-[200px] h-[100px] flex-c border border-[#aaa]">
          part synth
        </div>
      );
    },
  };
}
