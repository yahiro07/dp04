import { setupSoundEngine } from "@fd0/sound-engine";
import { setupMidiKeyboardInput } from "@lib/ax/midi-keyboard-input";
import { mountAppRoot } from "@lib/ax/mount-app-root";
import { Button } from "@lib/components1/button";
import { useEffect } from "react";
import { createStore } from "snap-store";

const soundEngine = await setupSoundEngine();

const store = createStore<{ programNumber: number }>({
  programNumber: 48,
});
soundEngine.selectProgram(0, store.state.programNumber);

store.subscribe((attrs) => {
  if (attrs.programNumber !== undefined) {
    soundEngine.selectProgram(0, attrs.programNumber);
  }
});

const uiActions = {
  async handleNote(noteNumber: number, velocity: number) {
    await soundEngine.resumeIfNeed();
    soundEngine.playNote(0, noteNumber, velocity > 0 ? 100 : 0); //fix velocity
  },
  selectProgram(programNumber: number) {
    store.mutations.setProgramNumber(programNumber);
  },
};

const MainPanel = () => {
  return (
    <div className="w-dvw h-dvh flex-vc gap-2">
      <div className="flex-ha gap-2">
        <Button onClick={() => uiActions.handleNote(52, 127)}>ON</Button>
        <Button onClick={() => uiActions.handleNote(52, 0)}>OFF</Button>
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
