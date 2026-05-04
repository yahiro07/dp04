import { WorkletSynthesizer } from "spessasynth_lib";

export type SoundEngine = {
  loadAssets(): Promise<void>;
  resumeIfNeed(): Promise<void>;
  selectProgram(ch: number, programNumber: number): void;
  playNote(ch: number, noteNumber: number, velocity: number): void;
};

export function createSoundEngine(): SoundEngine {
  const ctx = new AudioContext();
  let synth: WorkletSynthesizer | undefined;

  const warnIfNotReady = () => {
    if (!synth) {
      console.warn("sound engine not ready");
    }
  };

  return {
    async loadAssets() {
      const workletUrl = new URL(
        "spessasynth_lib/dist/spessasynth_processor.min.js",
        import.meta.url,
      );
      console.log({ workletUrl });
      await ctx.audioWorklet.addModule(workletUrl);
      const sfont = await (await fetch("/soundfonts/A320U.sf2")).arrayBuffer();

      synth = new WorkletSynthesizer(ctx);
      synth.connect(ctx.destination);
      await synth.soundBankManager.addSoundBank(sfont, "main");
      await synth.isReady;
    },
    async resumeIfNeed() {
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
    },
    selectProgram(ch: number, programNumber: number) {
      warnIfNotReady();
      synth?.programChange(ch, programNumber);
    },
    playNote(ch: number, noteNumber: number, velocity: number) {
      warnIfNotReady();
      if (velocity > 0) {
        synth?.noteOn(ch, noteNumber, velocity);
      } else {
        synth?.noteOff(ch, noteNumber);
      }
    },
  };
}
