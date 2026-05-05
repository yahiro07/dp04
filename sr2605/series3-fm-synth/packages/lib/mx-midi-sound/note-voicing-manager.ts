import { seqNumbers } from "@my/lib/ax/array-utils";

export function createNoteVoicingManager({
  destNoteFn,
  destProgramSelectionFn,
}: {
  destNoteFn(ch: number, noteNumber: number, velocity: number): void;
  destProgramSelectionFn(ch: number, program: number): void;
}) {
  const activeNotesMap = seqNumbers(16).map(() => new Set<number>());

  const channelProgramMap = seqNumbers(16).map(() => -1);

  return {
    setProgram(ch: number, programNumber: number) {
      if (channelProgramMap[ch] !== programNumber) {
        destProgramSelectionFn(ch, programNumber);
        channelProgramMap[ch] = programNumber;
      }
    },
    noteOn(ch: number, noteNumber: number, velocity: number) {
      if (!activeNotesMap[ch].has(noteNumber)) {
        destNoteFn(ch, noteNumber, velocity);
        activeNotesMap[ch].add(noteNumber);
      }
    },
    noteOff(ch: number, noteNumber: number) {
      if (activeNotesMap[ch].has(noteNumber)) {
        destNoteFn(ch, noteNumber, 0);
        activeNotesMap[ch].delete(noteNumber);
      }
    },
    channelNotesOff(ch: number) {
      const currentNotes = activeNotesMap[ch];
      if (currentNotes.size > 0) {
        currentNotes.forEach((noteNumber) => {
          destNoteFn(ch, noteNumber, 0);
        });
        currentNotes.clear();
      }
    },
    allNotesOff() {
      activeNotesMap.forEach((currentNotes, ch) => {
        currentNotes.forEach((noteNumber) => {
          destNoteFn(ch, noteNumber, 0);
        });
        currentNotes.clear();
      });
    },
  };
}
