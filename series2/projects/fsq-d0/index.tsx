import { createSequencer } from "@fd0/sequencer";
import { setupSoundEngine } from "@fd0/sound-engine";
import { setupMidiKeyboardInput } from "@lib/ax/midi-keyboard-input";
import { mountAppRoot } from "@lib/ax/mount-app-root";
import { Button } from "@lib/components1/button";
import { useEffect } from "react";
import { createStore } from "snap-store";

const soundEngine = await setupSoundEngine();
const sequencer = createSequencer(soundEngine);

const store = createStore<{
  programNumber: number;
  playing: boolean;
  fish1Active: boolean;
}>({
  playing: false,
  programNumber: 48,
  fish1Active: false,
});
soundEngine.selectProgram(0, store.state.programNumber);

store.subscribe(({ programNumber, playing, fish1Active }) => {
  if (programNumber !== undefined) {
    soundEngine.selectProgram(0, programNumber);
  }
  if (playing !== undefined) {
    if (playing) {
      sequencer.handelCommand({ type: "start" });
    } else {
      sequencer.handelCommand({ type: "stop" });
    }
  }
  if (fish1Active !== undefined) {
    sequencer.handelCommand({
      type: "setUnitActive",
      unitId: "fish1",
      active: fish1Active,
    });
  }
});
store.setFish1Active(true);

const uiActions = {
  togglePlayState() {
    store.mutations.togglePlaying();
  },
  toggleFish1Active() {
    store.mutations.toggleFish1Active();
  },
  async handleNote(noteNumber: number, velocity: number) {
    await soundEngine.resumeIfNeed();
    soundEngine.playNote(0, noteNumber, velocity > 0 ? 100 : 0); //fix velocity
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
  const st = store.useSnapshot();
  return (
    <div className="w-dvw h-dvh flex-vc gap-2">
      <div className="flex-ha gap-2">
        <Button active={st.playing} onClick={() => uiActions.togglePlayState()}>
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
    setupMidiKeyboardInput({
      noteCallback: uiActions.handleNote,
    });
  });
  return <MainPanel />;
};

mountAppRoot(<App />, "app");
