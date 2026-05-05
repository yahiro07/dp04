import { MainSynthesizerUnit } from "@ds2/synth-units/main-synthesizer/interface";

export function createMainSynthesizer(
  audioContext: AudioContext,
): MainSynthesizerUnit {
  return {
    setupEngine(): AudioNode {
      const node = new GainNode(audioContext);
      return node;
    },
    noteOn(ch: number, noteNumber: number, velocity: number): void {
      console.log(
        `noteOn: ch=${ch}, noteNumber=${noteNumber}, velocity=${velocity}`,
      );
    },
    noteOff(ch: number, noteNumber: number): void {
      console.log(`noteOff: ch=${ch}, noteNumber=${noteNumber}`);
    },
    renderUi() {
      return (
        <div class="w-[200px] h-[100px] flex-c border border-[#aaa]">
          main synth
        </div>
      );
    },
  };
}
