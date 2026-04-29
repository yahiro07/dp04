import { createRootMachine } from "@fd0/backend/root-machine";
import { setupMidiKeyboardInput } from "@lib/ax/midi-keyboard-input";
import { mountAppRoot } from "@lib/ax/mount-app-root";
import { Button } from "@lib/components1/button";
import { useEffect } from "react";
import { createStore } from "snap-store";

const rootMachine = createRootMachine();

const store = createStore<{
  programNumber: number;
  playing: boolean;
  fish1Active: boolean;
  initializing: boolean;
}>({
  playing: false,
  programNumber: 48,
  fish1Active: false,
  initializing: false,
});

store.subscribe(({ programNumber, playing, fish1Active }) => {
  if (programNumber !== undefined) {
    rootMachine.handleCommand({
      type: "setUnitInstrumentId",
      unitId: "primary-tone",
      instrumentId: `gm-${programNumber}`,
    });
  }
  if (playing !== undefined) {
    if (playing) {
      rootMachine.handleCommand({ type: "setPlayState", playing: true });
    } else {
      rootMachine.handleCommand({ type: "setPlayState", playing: false });
    }
  }
  if (fish1Active !== undefined) {
    rootMachine.handleCommand({
      type: "setUnitActive",
      unitId: "fish1",
      active: fish1Active,
    });
  }
});

const uiActions = {
  togglePlayState() {
    store.mutations.togglePlaying();
  },
  toggleFish1Active() {
    store.mutations.toggleFish1Active();
  },
  async handleNote(noteNumber: number, velocity: number) {
    await rootMachine.resumeIfNeed();
    rootMachine.handleCommand({
      type: "playPrimaryTone",
      noteNumber,
      velocity: velocity > 0 ? 100 : 0, //fixed velocity
    });
  },
  selectProgram(programNumber: number) {
    store.mutations.setProgramNumber(programNumber);
  },
};

const fishImageUrls = {
  active: "/images/fish-active.png",
  inactive: "/images/fish-inactive.png",
};

const UnitView = ({ unitId }: { unitId: string }) => {
  const st = store.useSnapshot();
  const active = st.fish1Active;
  const handleToggleActive = () => {
    uiActions.toggleFish1Active();
  };
  return (
    <div onClick={handleToggleActive} className="relative">
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
        <Button active={playing} onClick={() => uiActions.togglePlayState()}>
          play
        </Button>
      </div>
      <div className="flex-v gap-2">
        <UnitView unitId="fish1" />
      </div>
      <div>
        <Button onClick={() => uiActions.selectProgram(0)}>piano</Button>
        <Button onClick={() => uiActions.selectProgram(4)}>e.piano</Button>
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
        noteCallback: uiActions.handleNote,
      });
      rootMachine.handleCommand({
        type: "setUnitInstrumentId",
        unitId: "primary-tone",
        instrumentId: `gm-${store.state.programNumber}`,
      });
      store.setFish1Active(true);
    })();
  }, []);
  return <MainPanel />;
};

mountAppRoot(<App />, "app");
