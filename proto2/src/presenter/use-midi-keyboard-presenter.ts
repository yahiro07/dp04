import { appStore } from "@/central/app-store";

type MidiKeyboardPresenter = {
  connected: boolean;
  holdingNotes: number[];
};

export function useMidiKeyboardPresenter(): MidiKeyboardPresenter {
  const state = appStore.useSnapshot();
  return {
    connected: state.midiInputConnected,
    holdingNotes: state.midiInputNotes,
  };
}
