import { logicActions } from "@/central/logic-actions";

export const uiActions = {
  triggerUiMidiNote(noteNumber: number, velocity: number) {
    logicActions.handleMidiNoteInput(noteNumber, velocity);
  },
};
