import { setupSoundEngine } from "@fd0/sound-engine";
import { setupMidiKeyboardInput } from "@lib/ax/midi-keyboard-input";
import { mountAppRoot } from "@lib/ax/mount-app-root";
import { Button } from "@lib/components1/button";
import { useEffect } from "react";

const soundEngine = await setupSoundEngine();
soundEngine.selectProgram(0, 48);

const uiActions = {
  async handleNote(noteNumber: number, velocity: number) {
    await soundEngine.resumeIfNeed();
    soundEngine.playNote(0, noteNumber, velocity > 0 ? 100 : 0); //fix velocity
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
