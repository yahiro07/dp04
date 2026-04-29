import { rootMachine, store, uiOperations } from "@fd0/store";
import { DynamicUnit } from "@fd0/types";
import { setupMidiKeyboardInput } from "@lib/ax/midi-keyboard-input";
import { mountAppRoot } from "@lib/ax/mount-app-root";
import { Button } from "@lib/components1/button";
import { npx } from "@lib/styling/styling-utils";
import { useEffect } from "react";

const fishImageUrls = {
  active: "/images/fish-active.png",
  inactive: "/images/fish-inactive.png",
};

const UnitView = ({ unit }: { unit: DynamicUnit }) => {
  const { id: unitId, active, position } = unit;
  return (
    <div
      className="absolute"
      style={{
        left: npx(position.x),
        top: npx(position.y),
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        onClick={() => uiOperations.setUnitActive(unitId, !active)}
        className="relative"
      >
        <div className="absolute top-[-8px] left-0 w-full text-center text-[#888]">
          {unitId}
        </div>
        <img
          src={active ? fishImageUrls.active : fishImageUrls.inactive}
          alt="fish"
          className="w-[150px]"
        />
      </div>
    </div>
  );
};

const SceneField = () => {
  const { units } = store.useSnapshot();
  return (
    <div className="w-[600px] h-[400px] border border-[#ccc]">
      <div
        className="w-full h-full relative"
        style={{ transform: "translate(50%, 50%)" }}
      >
        {units.map((unit) => (
          <UnitView key={unit.id} unit={unit} />
        ))}
      </div>
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

      <SceneField />
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
      const scene = rootMachine.getSceneState();
      store.mutations.setUnits(scene.units);
    })();
  }, []);
  return <MainPanel />;
};

mountAppRoot(<App />, "app");
