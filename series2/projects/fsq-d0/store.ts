import { createRootMachine } from "@fd0/backend/root-machine";
import { UiAction } from "@fd0/types";
import {
  CommandDispatcher,
  createCommandDispatcher,
} from "@lib/ax/command-dispatcher";
import { createStore } from "snap-store";

export const rootMachine = createRootMachine();

export const store = createStore<{
  primaryToneInstrumentId: string;
  playing: boolean;
  fish1Active: boolean;
  initializing: boolean;
}>({
  playing: false,
  primaryToneInstrumentId: "gm-48",
  fish1Active: false,
  initializing: false,
});

function createUiActionDispatcher(): CommandDispatcher<UiAction> {
  const mut = store.mutations;
  return createCommandDispatcher<UiAction>({
    setPlayState(e) {
      mut.setPlaying(e.playing);
    },
    setBpm(e) {},
    playPrimaryTone(e) {},
    setKey(e) {},
    addPatternUnit(e) {},
    removePatternUnit(e) {},
    setUnitActive(e) {
      if (e.unitId === "fish1") {
        mut.setFish1Active(e.active);
      }
    },
    setUnitStepNote(e) {},
    setUnitInstrumentId(e) {
      mut.setPrimaryToneInstrumentId(e.instrumentId);
    },
  });
}
const uiActionDispatcher = createUiActionDispatcher();

function dispatchUiAction(action: UiAction) {
  uiActionDispatcher.apply(action);
  rootMachine.handleCommand(action);
}

export const uiOperations = {
  togglePlayState() {
    const playing = !store.state.playing;
    dispatchUiAction({ type: "setPlayState", playing });
  },
  toggleFish1Active() {
    const active = !store.state.fish1Active;
    dispatchUiAction({ type: "setUnitActive", unitId: "fish1", active });
  },
  async handleNote(noteNumber: number, velocity: number) {
    await rootMachine.resumeIfNeed();
    dispatchUiAction({
      type: "playPrimaryTone",
      noteNumber,
      velocity: velocity > 0 ? 100 : 0, //fixed velocity
    });
  },
  selectProgram(instrumentId: string) {
    dispatchUiAction({
      type: "setUnitInstrumentId",
      unitId: "primary-tone",
      instrumentId,
    });
  },
};
