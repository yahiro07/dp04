import { DrumKitToneId } from "@ds2/synth-units/drum-synthesizer/types";
import { UiRoot } from "@ds2/synth-units/drum-synthesizer/ui-root";
import { createUnitEngine } from "@ds2/synth-units/drum-synthesizer/unit-engine";
import { JsxElement } from "@lib/ax-solid/types";

export type DrumSynthesizerUnit = {
  setupEngine(audioContext: AudioContext): AudioNode;
  playTone(toneId: DrumKitToneId): void;
  renderUi(props: { currentToneId: DrumKitToneId }): JsxElement;
};

export function createDrumSynthesizerUnit(): DrumSynthesizerUnit {
  const unitEngine = createUnitEngine();
  return {
    setupEngine(audioContext) {
      return unitEngine.initialize(audioContext);
    },
    playTone(toneId) {
      unitEngine.handleCommand({ type: "playTone", toneId });
    },
    renderUi(props) {
      return (
        <UiRoot unitEngine={unitEngine} currentToneId={props.currentToneId} />
      );
    },
  };
}
