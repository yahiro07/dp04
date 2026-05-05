import { JsxElement } from "@my/lib/ax-solid/types";
import { DrumKitToneId } from "./types";
import { UiRoot } from "./ui-root";
import { createUnitEngine } from "./unit-engine";

export * from "./types";

export type UnitFs2DrumSynth = {
  setupEngine(audioContext: AudioContext): AudioNode;
  playTone(toneId: DrumKitToneId): void;
  renderUi(props: { currentToneId: DrumKitToneId }): JsxElement;
};

export function createUnitFs2DrumSynth(): UnitFs2DrumSynth {
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
