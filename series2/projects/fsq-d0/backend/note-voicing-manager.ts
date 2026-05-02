import { seqNumbers } from "@lib/ax/array-utils";

export function createNoteVoicingManager({
  destFn,
}: {
  destFn: (ch: number, noteNumber: number, velocity: number) => void;
}) {
  const activeNotesMap = seqNumbers(16).map(() => new Set<number>());

  return {
    noteOn(ch: number, noteNumber: number, velocity: number) {
      destFn(ch, noteNumber, velocity);
      activeNotesMap[ch].add(noteNumber);
    },
    channelNotesOff(ch: number) {
      const currentNotes = activeNotesMap[ch];
      if (currentNotes.size > 0) {
        currentNotes.forEach((noteNumber) => {
          destFn(ch, noteNumber, 0);
        });
        currentNotes.clear();
      }
    },
    allNotesOff() {
      activeNotesMap.forEach((currentNotes, ch) => {
        currentNotes.forEach((noteNumber) => {
          destFn(ch, noteNumber, 0);
        });
        currentNotes.clear();
      });
    },
  };
}
