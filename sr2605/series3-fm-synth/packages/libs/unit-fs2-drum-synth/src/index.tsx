import { createUnitEngine } from "@/machine/unit-engine";
import { UiRoot } from "@/ui/ui-root";
import { DrumSynthesizerUnit } from "../../unit-contract";

export function createUnitFs2DrumSynth(): DrumSynthesizerUnit {
  const unitEngine = createUnitEngine();
  return {
    setupEngine(audioContext) {
      return unitEngine.initialize(audioContext);
    },
    async loadEngine() {
      await unitEngine.load();
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
