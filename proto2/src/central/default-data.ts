import type { SynthPattern } from "@/central/model-types";

export const defaultSynthPatterns: SynthPattern[] = [
  {
    programNumber: 33,
    loopDuration: 16,
    notes: [
      { relativeNoteNumber: 0, stepPosition: 2, stepDuration: 2 },
      { relativeNoteNumber: 0, stepPosition: 6, stepDuration: 2 },
      { relativeNoteNumber: 7, stepPosition: 10, stepDuration: 2 },
      { relativeNoteNumber: 0, stepPosition: 14, stepDuration: 2 },
    ],
  },
];
