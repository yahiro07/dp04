import type { NoteRange } from "@/types/midi";

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

export function formatNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  return `${name}${octave}`;
}

export function formatOctaveRange(range: NoteRange): string {
  const start = `C${range.minOctave - 1}`;
  const end = `B${range.maxOctave - 1}`;
  return `${start} - ${end}`;
}
