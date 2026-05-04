import { appStore } from "@/central/app-store";

export const storeMutations = {
  setMidiInputConnected(connected: boolean) {
    appStore.mutations.setMidiInputConnected(connected);
  },
  updateMidiInputNotes(noteNumber: number, velocity: number) {
    appStore.mutations.setMidiInputNotes((prev) => {
      if (velocity > 0) {
        return [...prev, noteNumber];
      } else {
        return prev.filter((n) => n !== noteNumber);
      }
    });
  },
};
