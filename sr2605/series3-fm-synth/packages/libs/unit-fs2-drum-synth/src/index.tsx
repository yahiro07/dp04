import { JsxElement } from "@my/lib/ax-solid/types";
import { createUnitEngine } from "@/machine/unit-engine";
import { UiRoot } from "@/ui/ui-root";

export type UnitFs2DrumSynth = {
  setupEngine(audioContext: AudioContext): Promise<AudioNode>;
  playTone(ch: number): void;
  renderUi(props: { currentChannel: number }): JsxElement;
};

export function createUnitFs2DrumSynth(): UnitFs2DrumSynth {
  const unitEngine = createUnitEngine();
  return {
    setupEngine(audioContext) {
      return unitEngine.initialize(audioContext);
    },
    playTone(ch) {
      unitEngine.handleCommand({ type: "playTone", ch });
    },
    renderUi(props) {
      return (
        <UiRoot unitEngine={unitEngine} currentChannel={props.currentChannel} />
      );
    },
  };
}
