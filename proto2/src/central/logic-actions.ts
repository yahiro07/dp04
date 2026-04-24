import { appStore } from "@/central/app-store";
import { setupMidiKeyboardInput } from "@/central/periphery/midi-keyboard-input";

export const logicActions = {
  handleMidiConnectionStateChange(connected: boolean) {
    appStore.mutations.setMidiInputConnected(connected);
  },
  handleMidiNoteInput(noteNumber: number, velocity: number) {
    appStore.mutations.setMidiInputNotes((prev) => {
      if (velocity > 0) {
        return [...prev, noteNumber];
      } else {
        return prev.filter((n) => n !== noteNumber);
      }
    });
  },
  wrapSetupMidiKeyboardInput() {
    return setupMidiKeyboardInput({
      connectionStateCallback: this.handleMidiConnectionStateChange,
      noteCallback: this.handleMidiNoteInput,
    });
  },
};
