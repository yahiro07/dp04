import { JsxElement } from "@my/lib/ax-solid/types";
import { DrumKitToneId } from "@/base/types";
import { createUnitEngine } from "@/machine/unit-engine";
import { UiRoot } from "@/ui/ui-root";

export type { DrumKitToneId } from "@/base/types";

export type UnitFs2DrumSynth = {
  setupEngine(audioContext: AudioContext): Promise<AudioNode>;
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
