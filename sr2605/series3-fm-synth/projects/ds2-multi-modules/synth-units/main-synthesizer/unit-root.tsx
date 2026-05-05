export function createMainSynthesizer(audioContext: AudioContext) {
  return {
    setupEngine(): AudioNode {
      const node = new GainNode(audioContext);
      return node;
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
