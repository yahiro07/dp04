import { appStore } from "@/central/app-store";

export const appActions = {
  handleMidiConnectionStateChange(connected: boolean) {
    appStore.mutations.setMidiInputConnected(connected);
  },
  handleMidiNoteInput(noteNumber: number, velocity: number) {
    console.log("midi note input:", noteNumber, velocity);
    appStore.mutations.setMidiInputNotes((prev) => {
      if (velocity > 0) {
        return [...prev, noteNumber];
      } else {
        return prev.filter((n) => n !== noteNumber);
      }
    });
  },
};
