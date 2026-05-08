import { InstrumentSynthesizerUnit } from "@my/unit-contract";
import { UiRoot } from "@/ui-root";
import { createUnitEngine } from "@/unit-engine";

export function createUnitFs4ToneSynth(): InstrumentSynthesizerUnit {
  const unitEngine = createUnitEngine();
  return {
    setupEngine(audioContext) {
      return unitEngine.initialize(audioContext);
    },
    async loadEngine() {},
    noteOn(ch, noteNumber) {
      unitEngine.noteOn(ch, noteNumber);
    },
    noteOff(ch, noteNumber) {
      unitEngine.noteOff(ch, noteNumber);
    },
    renderUi() {
      return <UiRoot unitEngine={unitEngine} />;
    },
  };
}
