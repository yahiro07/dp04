import { rootMachine, store, uiOperations } from "@fd0/store";
import { setupMidiKeyboardInput } from "@lib/ax/midi-keyboard-input";
import { mountAppRoot } from "@lib/ax/mount-app-root";
import { Button } from "@lib/components1/button";
import { useEffect } from "react";

const fishImageUrls = {
  active: "/images/fish-active.png",
  inactive: "/images/fish-inactive.png",
};

const UnitView = ({ unitId }: { unitId: string }) => {
  const { fish1Active } = store.useSnapshot();
  return (
    <div onClick={uiOperations.toggleFish1Active} className="relative">
      <div className="absolute top-[-8px] left-0 w-full text-center text-[#888]">
        {unitId}
      </div>
      <img
        src={fish1Active ? fishImageUrls.active : fishImageUrls.inactive}
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
