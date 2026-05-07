import { InstrumentSynthesizerUnit } from "@my/unit-contract";
import { createRootMachine } from "@/machine/root-machine";
import { App } from "@/ui/app";
import { initializeApp } from "@/ui/store";

export function createUnitFs1FmSynth(): InstrumentSynthesizerUnit {
  console.log("createUnitFs1FmSynth 2114");
  const rootMachine = createRootMachine();

  return {
    setupEngine(audioContext) {
      const outputNode = rootMachine.initialize(audioContext);
      initializeApp(rootMachine);
      return outputNode;
    },
    async loadEngine() {
      await rootMachine.load();
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
