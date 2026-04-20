import { CommandItem } from "@/smf-reader";

type SmfPlayer = {
  play(commands: CommandItem[]): void;
  stop(): void;
};
export function createSmfPlayer(): SmfPlayer {
  const synth = new (
    window as unknown as {
      WebAudioTinySynth: new () => { send: (data: number[]) => void };
    }
  ).WebAudioTinySynth();
  //usage
  //synth.send([0x90, 36, 100])

  return {
    play() {},
    stop() {},
  };
}
