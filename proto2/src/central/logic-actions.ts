import { setupMidiKeyboardInput } from "@/central/periphery/midi-keyboard-input";
import { storeMutations } from "@/central/store-mutations";

export const logicActions = {
  handleMidiConnectionStateChange(connected: boolean) {
    storeMutations.setMidiInputConnected(connected);
  },
  handleMidiNoteInput(noteNumber: number, velocity: number) {
    storeMutations.updateMidiInputNotes(noteNumber, velocity);
  },
  wrapSetupMidiKeyboardInput() {
    return setupMidiKeyboardInput({
      connectionStateCallback: this.handleMidiConnectionStateChange,
      noteCallback: this.handleMidiNoteInput,
    });
  },
};
