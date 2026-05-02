import { appStore } from "@/central/app-store";
import type { SynthPattern, SynthPatternNote } from "@/central/model-types";

type CurrentSynthPatternPresenter = {
  programNumber: number;
  loopDuration: number;
  notes: SynthPatternNote[];
  setProgramNumber(prog: number): void;
  setLoopDuration(duration: number): void;
  replaceNotes(notes: SynthPatternNote[]): void;
};

export function useCurrentSynthPatternPresenter(): CurrentSynthPatternPresenter {
  const appSnapshot = appStore.useSnapshot();

  const currentPattern = appSnapshot.synthPatterns[0];

  const patchCurrentSynthAttrs = (attrs: Partial<SynthPattern>) => {
    appStore.mutations.setSynthPatterns({
      ...appSnapshot.synthPatterns,
      [0]: {
        ...appSnapshot.synthPatterns[0],
        ...attrs,
      },
    });
  };

  return {
    programNumber: currentPattern.programNumber,
    loopDuration: currentPattern.loopDuration,
    notes: currentPattern.notes,
    setProgramNumber: (prog: number) => {
      patchCurrentSynthAttrs({ programNumber: prog });
    },
    setLoopDuration: (duration: number) => {
      patchCurrentSynthAttrs({ loopDuration: duration });
    },
    replaceNotes: (notes: SynthPatternNote[]) => {
      patchCurrentSynthAttrs({ notes });
    },
  };
}
