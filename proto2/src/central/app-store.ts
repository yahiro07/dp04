import { createStore } from "snap-store";

type StoreState = {
  midiInputConnected: boolean;
  midiInputNotes: number[];
};
export const appStore = createStore<StoreState>({
  midiInputConnected: false,
  midiInputNotes: [],
});
