import { InstrumentSynthesizerUnit } from "@my/unit-contract";
import { UiRoot } from "@/ui-root";
import { createUnitEngine } from "@/unit-engine";

export function createMainSynthesizerUnit(): InstrumentSynthesizerUnit {
  const unitEngine = createUnitEngine();
  return {
    setupEngine(audioContext) {
      return unitEngine.initialize(audioContext);
    },
    async loadEngine() {},
    noteOn(ch, noteNumber, velocity) {
      unitEngine.handleCommand({
        type: "noteOn",
        channel: ch,
        noteNumber,
        velocity,
      });
    },
    noteOff(ch, noteNumber) {
      unitEngine.handleCommand({
        type: "noteOff",
        channel: ch,
        noteNumber,
      });
    },
    renderUi() {
      return <UiRoot unitEngine={unitEngine} />;
    },
  };
}
