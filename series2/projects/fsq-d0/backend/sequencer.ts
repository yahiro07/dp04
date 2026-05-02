import { createNoteVoicingManager } from "@fd0/backend/note-voicing-manager";
import { Scene, SpecialNote } from "@fd0/types";
import { SoundEngine } from "./sound-engine";
export function createSequencer(soundEngine: SoundEngine, scene: Scene) {
  let timerId: number;

  let stepIndex = 0;
  let frameCount = 0;

  const rootNote = 36 + 9;

  const noteManager = createNoteVoicingManager({
    destFn: soundEngine.playNote,
  });

  const internal = {
    onStep() {
      for (const unit of scene.units) {
        if (unit.variant === "seri8-drum") {
          const note = unit.stepNotes[stepIndex];
          if (note === SpecialNote.rest) {
            noteManager.channelNotesOff(9);
          } else if (note === SpecialNote.tie) {
          } else {
            if (unit.active) {
              noteManager.noteOn(9, note, 100);
            }
          }
        }
        if (unit.variant === "seri8") {
          const relNote = unit.relativeNotes[stepIndex];
          const ch = unit.channel;
          if (relNote === SpecialNote.rest) {
            noteManager.channelNotesOff(ch);
          } else if (relNote === SpecialNote.tie) {
          } else {
            if (unit.active) {
              const note = rootNote + relNote;
              noteManager.noteOn(ch, note, 100);
            } else {
              noteManager.channelNotesOff(ch);
            }
          }
        }
      }
      stepIndex++;
      if (stepIndex >= 8) {
        stepIndex = 0;
      }
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
      noteManager.allNotesOff();
      clearInterval(timerId);
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
