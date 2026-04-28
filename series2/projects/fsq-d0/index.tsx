import { SoundEngine, setupSoundEngine } from "@fd0/sound-engine";
import { setupMidiKeyboardInput } from "@lib/ax/midi-keyboard-input";
import { mountAppRoot } from "@lib/ax/mount-app-root";
import { Button } from "@lib/components1/button";
import { useEffect } from "react";
import { createStore } from "snap-store";

type SequencerCommand =
  | { type: "start" }
  | { type: "stop" }
  | { type: "setUnitActive"; unitId: string; active: boolean };

function createSequencer(soundEngine: SoundEngine) {
  let timerId: number;

  let frameCount = 0;

  let fish1Active = false;

  const handleTick = () => {
    frameCount++;
    if (fish1Active) {
      if (frameCount % 20 === 0) {
        soundEngine.playNote(9, 36, 100);
      }
      if (frameCount % 20 === 10) {
        soundEngine.playNote(9, 36, 0);
      }
      if (frameCount % 20 === 10) {
        soundEngine.playNote(9, 38, 100);
      }
      if (frameCount % 20 === 15) {
        soundEngine.playNote(9, 38, 0);
      }
    }
  };

  const internal = {
    start() {
      timerId = setInterval(handleTick, 50);
    },
    stop() {
      clearInterval(timerId);
    },
  };

  return {
    handelCommand(command: SequencerCommand) {
      if (command.type === "start") internal.start();
      if (command.type === "stop") internal.stop();
      if (command.type === "setUnitActive") {
        if (command.unitId === "fish1") {
          fish1Active = command.active;
        }
      }
    },
  };
}

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

const MainPanel = () => {
  const st = store.useSnapshot();
  return (
    <div className="w-dvw h-dvh flex-vc gap-2">
      <div className="flex-ha gap-2">
        <Button active={st.playing} onClick={() => uiActions.togglePlayState()}>
          play
        </Button>
        <Button
          active={st.fish1Active}
          onClick={() => uiActions.toggleFish1Active()}
        >
          fish1
        </Button>
      </div>
      <div className="flex-v gap-2">
        <img src="/images/fish-active.png" alt="fish" className="w-[150px]" />
        <img src="/images/fish-inactive.png" alt="fish" className="w-[150px]" />
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
