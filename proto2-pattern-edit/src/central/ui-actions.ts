import { logicActions } from "@/central/logic-actions";

export const uiActions = {
  triggerUiMidiNote(noteNumber: number, velocity: number, ch: number = 1) {
    logicActions.handleMidiNoteInput(noteNumber, velocity, ch);
  },
};
