import { UiRoot } from "@ds2/synth-units/main-synthesizer/ui-root";
import { createUnitEngine } from "@ds2/synth-units/main-synthesizer/unit-engine";
import { JsxElement } from "@lib/ax-solid/types";

export type MainSynthesizerUnit = {
  setupEngine(audioContext: AudioContext): AudioNode;
  noteOn(ch: number, noteNumber: number, velocity: number): void;
  noteOff(ch: number, noteNumber: number): void;
  renderUi(): JsxElement;
};
export function createMainSynthesizerUnit(): MainSynthesizerUnit {
  const unitEngine = createUnitEngine();
  return {
    setupEngine(audioContext) {
      return unitEngine.initialize(audioContext);
    },
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
