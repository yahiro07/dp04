import { appStore } from "@/central/app-store";
import { uiActions } from "@/central/ui-actions";

type MidiKeyboardPresenter = {
  connected: boolean;
  holdingNotes: number[];
  triggerUiMidiNote(noteNumber: number, velocity: number): void;
};

export function useMidiKeyboardPresenter(): MidiKeyboardPresenter {
  const state = appStore.useSnapshot();
  return {
    connected: state.midiInputConnected,
    holdingNotes: state.midiInputNotes,
    triggerUiMidiNote: uiActions.triggerUiMidiNote,
  };
}
