import { createRootMachine } from "@fd0/backend/root-machine";
import { UiAction } from "@fd0/types";
import {
  CommandDispatcher,
  createCommandDispatcher,
} from "@lib/ax/command-dispatcher";
import { setupMidiKeyboardInput } from "@lib/ax/midi-keyboard-input";
import { mountAppRoot } from "@lib/ax/mount-app-root";
import { Button } from "@lib/components1/button";
import { useEffect } from "react";
import { createStore } from "snap-store";

const rootMachine = createRootMachine();

const store = createStore<{
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

const uiOperations = {
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

const fishImageUrls = {
  active: "/images/fish-active.png",
  inactive: "/images/fish-inactive.png",
};

const UnitView = ({ unitId }: { unitId: string }) => {
  const st = store.useSnapshot();
  const active = st.fish1Active;
  return (
    <div onClick={uiOperations.toggleFish1Active} className="relative">
      <div className="absolute top-[-8px] left-0 w-full text-center text-[#888]">
        {unitId}
      </div>
      <img
        src={active ? fishImageUrls.active : fishImageUrls.inactive}
        alt="fish"
        className="w-[150px]"
      />
    </div>
  );
};

const MainPanel = () => {
  const { initializing, playing } = store.useSnapshot();
  if (initializing) {
    return <div>loading...</div>;
  }
  return (
    <div className="w-dvw h-dvh flex-vc gap-2">
      <div className="flex-ha gap-2">
        <Button active={playing} onClick={() => uiOperations.togglePlayState()}>
          play
        </Button>
      </div>
      <div className="flex-v gap-2">
        <UnitView unitId="fish1" />
      </div>
      <div>
        <Button onClick={() => uiOperations.selectProgram("gm-0")}>
          piano
        </Button>
        <Button onClick={() => uiOperations.selectProgram("gm-4")}>
          e.piano
        </Button>
      </div>
    </div>
  );
};

const App = () => {
  useEffect(() => {
    (async () => {
      store.mutations.setInitializing(true);
      await rootMachine.initialize();
      store.mutations.setInitializing(false);
      setupMidiKeyboardInput({
        noteCallback: uiOperations.handleNote,
      });
      uiOperations.selectProgram(store.state.primaryToneInstrumentId);
    })();
  }, []);
  return <MainPanel />;
};

mountAppRoot(<App />, "app");
