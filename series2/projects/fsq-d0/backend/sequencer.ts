import { SoundEngine } from "./sound-engine";

export type SequencerCommand =
  | { type: "start" }
  | { type: "stop" }
  | { type: "setUnitActive"; unitId: string; active: boolean };

export function createSequencer(soundEngine: SoundEngine) {
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
