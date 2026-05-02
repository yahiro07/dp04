import { createStore } from "snap-store";
import { defaultSynthPatterns } from "@/central/default-data";
import type { SynthPattern } from "@/central/model-types";

type StoreState = {
  midiInputConnected: boolean;
  midiInputNotes: number[];
  synthPatterns: SynthPattern[];
};
export const appStore = createStore<StoreState>({
  midiInputConnected: false,
  midiInputNotes: [],
  synthPatterns: defaultSynthPatterns,
});
