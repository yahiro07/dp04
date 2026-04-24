export type SynthPatternNote = {
  relativeNoteNumber: number;
  stepPosition: number;
  stepDuration: number;
};
export type SynthPattern = {
  programNumber: number;
  loopDuration: number;
  notes: SynthPatternNote[];
};
