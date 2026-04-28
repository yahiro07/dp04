import { WorkletSynthesizer } from "spessasynth_lib";

export async function setupSoundEngine() {
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
  return {
    async resumeIfNeed() {
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
    },
    selectProgram(ch: number, programNumber: number) {
      synth.programChange(ch, programNumber);
    },
    playNote(ch: number, noteNumber: number, velocity: number) {
      if (velocity > 0) {
        synth.noteOn(ch, noteNumber, velocity);
      } else {
        synth.noteOff(ch, noteNumber);
      }
    },
  };
}
