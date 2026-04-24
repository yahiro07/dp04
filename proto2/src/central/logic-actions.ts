import { setupMidiKeyboardInput } from "@/central/periphery/midi-keyboard-input";
import { midiSoundEngine } from "@/central/periphery/midi-sound-engine";
import { storeMutations } from "@/central/store-mutations";

export const logicActions = {
  handleMidiConnectionStateChange(connected: boolean) {
    storeMutations.setMidiInputConnected(connected);
  },
  handleMidiNoteInput(noteNumber: number, velocity: number) {
    if (velocity > 0) {
      midiSoundEngine.noteOn(1, noteNumber, velocity);
    } else {
      midiSoundEngine.noteOff(1, noteNumber);
    }
    storeMutations.updateMidiInputNotes(noteNumber, velocity);
  },
  wrapSetupMidiKeyboardInput() {
    return setupMidiKeyboardInput({
      connectionStateCallback: this.handleMidiConnectionStateChange,
      noteCallback: this.handleMidiNoteInput,
    });
  },
};
