import { SoundEngine, setupSoundEngine } from "@fd0/sound-engine";
import { setupMidiKeyboardInput } from "@lib/ax/midi-keyboard-input";
import { mountAppRoot } from "@lib/ax/mount-app-root";
import { Button } from "@lib/components1/button";
import { useEffect } from "react";
import { createStore } from "snap-store";

function createSequencer(soundEngine: SoundEngine) {
  let timerId: number;

  let frameCount = 0;

  const handleTick = () => {
    frameCount++;
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
  };

  return {
    start() {
      timerId = setInterval(handleTick, 50);
    },
    stop() {
      clearInterval(timerId);
    },
  };
}

const soundEngine = await setupSoundEngine();
const sequencer = createSequencer(soundEngine);

const store = createStore<{ programNumber: number; playing: boolean }>({
  playing: false,
  programNumber: 48,
});
soundEngine.selectProgram(0, store.state.programNumber);

store.subscribe((attrs) => {
  if (attrs.programNumber !== undefined) {
    soundEngine.selectProgram(0, attrs.programNumber);
  }
});

const uiActions = {
  togglePlayState() {
    if (!store.state.playing) {
      sequencer.start();
      store.mutations.setPlaying(true);
    } else {
      sequencer.stop();
      store.mutations.setPlaying(false);
    }
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
