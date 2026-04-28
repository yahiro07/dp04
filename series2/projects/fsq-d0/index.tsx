import { mountAppRoot } from "@lib/ax/mount-app-root";
import { Button } from "@lib/components1/button";
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

const uiActions = {
  handleNote: async (isOn: boolean) => {
    await ctx.resume();
    synth.programChange(0, 48);

    if (isOn) {
      synth.noteOn(0, 52, 127);
    } else {
      synth.noteOff(0, 52);
    }
  },
};

const App = () => {
  return (
    <div className="w-dvw h-dvh flex-c">
      <Button onClick={() => uiActions.handleNote(true)}>ON</Button>
      <Button onClick={() => uiActions.handleNote(false)}>OFF</Button>
    </div>
  );
};

mountAppRoot(<App />, "app");
