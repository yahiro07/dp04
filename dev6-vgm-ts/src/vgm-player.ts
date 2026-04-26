import { createChipAY8910 } from "@/chip-psg-ay8910";
import { VgmSong } from "./types";

export function createVgmPlayer() {
  const audioCtx = new window.AudioContext();
  console.log(`audioCtx.sampleRate ${audioCtx.sampleRate}`);

  return {
    loadSong(song: VgmSong) {
      const { header, commands } = song;
      const vgmSampleRate = song.sampleRate;
      const chip = createChipAY8910(header.ay8910Clock);
      const myArrayBuffer = audioCtx.createBuffer(
        1,
        header.samplesCount,
        vgmSampleRate,
      );
      const nowBuffering = myArrayBuffer.getChannelData(0);

      let offset = 0;
      for (const command of commands) {
        if (command.type === "wait") {
          chip.fillBuffer(nowBuffering, offset, command.samples, vgmSampleRate);
          offset += command.samples;
        } else if (command.type === "setRegister") {
          chip.setRegister(command.address, command.value);
        }
      }

      const source = audioCtx.createBufferSource();

      source.buffer = myArrayBuffer;
      source.connect(audioCtx.destination);

      source.loop = true;

      source.start();

      audioCtx.suspend();
    },
    play() {
      audioCtx.resume();
    },
    stop() {
      audioCtx.suspend();
    },
  };
}
