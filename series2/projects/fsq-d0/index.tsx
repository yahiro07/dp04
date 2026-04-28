import { setupMidiKeyboardInput } from "@lib/ax/midi-keyboard-input";
import { mountAppRoot } from "@lib/ax/mount-app-root";
import { Button } from "@lib/components1/button";
import { useEffect } from "react";
import { WorkletSynthesizer } from "spessasynth_lib";

const workletUrl = new URL(
  "spessasynth_lib/dist/spessasynth_processor.min.js",
  import.meta.url,
);

const sfont = await (await fetch("/soundfonts/A320U.sf2")).arrayBuffer();
const ctx = new AudioContext();
await ctx.audioWorklet.addModule(workletUrl);
const synth = new WorkletSynthesizer(ctx);
synth.connect(ctx.destination);
await synth.soundBankManager.addSoundBank(sfont, "main");
await synth.isReady;
synth.programChange(0, 48);

const uiActions = {
  handleNote: async (noteNumber: number, velocity: number) => {
    await ctx.resume();
    if (velocity > 0) {
      synth.noteOn(9, noteNumber, 100); //fix velocity
    } else {
      synth.noteOff(9, noteNumber);
    }
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
