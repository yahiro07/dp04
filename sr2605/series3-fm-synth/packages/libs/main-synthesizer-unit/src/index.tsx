import { JsxElement } from "@my/lib/ax-solid/types";
import { UiRoot } from "@/ui-root";
import { createUnitEngine } from "@/unit-engine";

export type MainSynthesizerUnit = {
  setupEngine(audioContext: AudioContext): Promise<AudioNode>;
  noteOn(ch: number, noteNumber: number, velocity: number): void;
  noteOff(ch: number, noteNumber: number): void;
  renderUi(): JsxElement;
};
export function createMainSynthesizerUnit(): MainSynthesizerUnit {
  const unitEngine = createUnitEngine();
  return {
    async setupEngine(audioContext) {
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
