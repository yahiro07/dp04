import { InstrumentSynthesizerUnit } from "@my/unit-contract";
import { createUnitEngine } from "@/core/unit-engine";
import { UiRoot } from "@/ui/ui-root";

export function createUnitFs4ToneSynth(): InstrumentSynthesizerUnit {
  const unitEngine = createUnitEngine();
  return {
    setupEngine(audioContext) {
      return unitEngine.initialize(audioContext);
    },
    async loadEngine() {},
    noteOn(ch, noteNumber) {
      if (ch === -1) ch = unitEngine.getCurrentChannel();
      unitEngine.noteOn(ch, noteNumber);
    },
    noteOff(ch, noteNumber) {
      if (ch === -1) ch = unitEngine.getCurrentChannel();
      unitEngine.noteOff(ch, noteNumber);
    },
    renderUi() {
      return <UiRoot unitEngine={unitEngine} />;
    },
  };
}
