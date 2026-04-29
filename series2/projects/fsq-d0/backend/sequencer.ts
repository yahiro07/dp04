import { Scene, SpecialNote } from "@fd0/types";
import { SoundEngine } from "./sound-engine";
export function createSequencer(soundEngine: SoundEngine, scene: Scene) {
  let timerId: number;

  let stepIndex = 0;
  let frameCount = 0;

  const rootNote = 36 + 9;

  const internal = {
    onStep() {
      for (const unit of scene.units) {
        if (unit.variant === "seri8-drum") {
          const note = unit.stepNotes[stepIndex];
          if (note === SpecialNote.rest) {
            soundEngine.playNote(9, note, 0);
          } else if (note === SpecialNote.tie) {
          } else {
            soundEngine.playNote(9, note, 100);
          }
        }
        if (unit.variant === "seri8") {
          const relNote = unit.relativeNotes[stepIndex];
          const ch = unit.channel;
          const note = rootNote + relNote;
          if (relNote === SpecialNote.rest) {
            soundEngine.playNote(ch, note, 0);
          } else if (relNote === SpecialNote.tie) {
          } else {
            soundEngine.playNote(ch, note, 100);
          }
        }
      }
      stepIndex++;
      stepIndex %= 8;
    },
    onTick() {
      frameCount++;
      if (frameCount % 10 === 0) {
        internal.onStep();
      }
    },
    start() {
      for (const unit of scene.units) {
        if (unit.variant === "seri8") {
          const ch = unit.channel;
          const programNumber = getGmProgramNumberFromInstrumentId(
            unit.instrumentId,
          );
          soundEngine.selectProgram(ch, programNumber);
        }
      }
      frameCount = 0;
      stepIndex = 0;
      timerId = setInterval(internal.onTick, 50);
    },
    stop() {
      clearInterval(timerId);
      //todo: all sound off
    },
  };

  return {
    setPlayState(playing: boolean) {
      playing ? internal.start() : internal.stop();
    },
  };
}

function getGmProgramNumberFromInstrumentId(instrumentId: string): number {
  return parseInt(instrumentId.replace("gm-", ""), 10);
}
