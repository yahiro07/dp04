import { JsxElement } from "@my/lib/ax-solid/types";
import { rootMachine } from "@/machine/root-machine";
import { App } from "@/ui/app";
import { initializeApp } from "@/ui/store";

export type UnitFs1FmSynthUnit = {
  setupEngine(audioContext: AudioContext): Promise<AudioNode>;
  noteOn(ch: number, noteNumber: number, velocity: number): void;
  noteOff(ch: number, noteNumber: number): void;
  renderUi(): JsxElement;
};

export function createUnitFs1FmSynth(): UnitFs1FmSynthUnit {
  console.log("createUnitFs1FmSynth 2114");
  return {
    setupEngine(audioContext) {
      return initializeApp(audioContext);
    },
    noteOn(_ch, noteNumber, velocity) {
      rootMachine.handleCommand({
        type: "noteOn",
        noteNumber,
        velocity,
      });
    },
    noteOff(_ch, noteNumber) {
      rootMachine.handleCommand({
        type: "noteOff",
        noteNumber,
      });
    },
    renderUi() {
      return <App />;
    },
  };
}
