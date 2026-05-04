import { createRootMachine } from "@fd0/backend/root-machine";
import { DynamicUnit, UiAction } from "@fd0/types";
import {
  CommandDispatcher,
  createCommandDispatcher,
} from "@lib/ax/command-dispatcher";
import { createStore } from "snap-store";

export const rootMachine = createRootMachine();

export const store = createStore<{
  primaryToneInstrumentId: string;
  playing: boolean;
  initializing: boolean;
  units: DynamicUnit[];
}>({
  playing: false,
  primaryToneInstrumentId: "gm-48",
  initializing: false,
  units: [],
});

function createUiActionDispatcher(): CommandDispatcher<UiAction> {
  const mut = store.mutations;

  const updateUnit = (unitId: string, fn: (unit: DynamicUnit) => void) => {
    store.produceUnits((draft) => {
      const unit = draft.find((u) => u.id === unitId);
      unit && fn(unit);
    });
  };
  return createCommandDispatcher<UiAction>({
    setPlayState(e) {
      mut.setPlaying(e.playing);
    },
    setBpm(e) {},
    playPrimaryTone(e) {},
    setKey(e) {},
    addUnit(e) {},
    removeUnit(e) {},
    setUnitActive(e) {
      updateUnit(e.unitId, (unit) => {
        unit.active = e.active;
      });
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
  setUnitActive(unitId: string, active: boolean) {
    dispatchUiAction({ type: "setUnitActive", unitId, active });
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
