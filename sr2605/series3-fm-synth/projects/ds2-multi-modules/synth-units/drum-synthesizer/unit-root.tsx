import { DrumKitToneId, DrumSynthesizerUnit } from "./interface";

export function createDrumSynthesizer(
  audioContext: AudioContext,
): DrumSynthesizerUnit {
  return {
    setupEngine(): AudioNode {
      const node = new GainNode(audioContext);
      return node;
    },
    playTone(toneId: DrumKitToneId): void {
      console.log("playTone", toneId);
    },
    renderUi(props: { currentToneId: DrumKitToneId }) {
      return (
        <div class="w-[200px] h-[100px] flex-c border border-[#aaa]">
          drum synth {props.currentToneId}
        </div>
      );
    },
  };
}
