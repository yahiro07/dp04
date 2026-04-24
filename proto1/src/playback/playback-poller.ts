import { playbackEngine } from "../playback-engine";
import { useGrooveboxStore } from "../store";
import { startMidiInputService } from "./midi-input-service";
import { createPlaybackSnapshot } from "./playback-projection";

let started = false;

export function startPlaybackPoller() {
  if (started || typeof window === "undefined") {
    return;
  }

  started = true;
  playbackEngine.init();

  const store = useGrooveboxStore;
  const initialState = store.getState();
  const activeMidiNotes = new Set<number>();
  playbackEngine.applySnapshot(createPlaybackSnapshot(initialState.song));

  store.subscribe((state, previousState) => {
    if (state.song !== previousState.song) {
      playbackEngine.applySnapshot(createPlaybackSnapshot(state.song));
    }

    if (
      state.playback.intent.isPlaying !==
      previousState.playback.intent.isPlaying
    ) {
      if (state.playback.intent.isPlaying) {
        void playbackEngine.play();
      } else {
        playbackEngine.stop();
      }
    }

    if (
      state.playback.intent.queuedSceneIndex !==
      previousState.playback.intent.queuedSceneIndex
    ) {
      playbackEngine.setQueuedScene(state.playback.intent.queuedSceneIndex);
    }
  });

  const tick = () => {
    const currentState = store.getState();
    const transport = playbackEngine.getTransportState();

    currentState.setTransportView({
      currentStepIndex: transport.stepIndex,
      currentBarIndex: transport.barIndex,
      localStepIndex: transport.localStepIndex,
    });

    for (const event of playbackEngine.drainEvents()) {
      if (event.type === "scene-advanced") {
        currentState.commitPlaybackSceneAdvance(event.sceneIndex);
      }
    }

    window.requestAnimationFrame(tick);
  };

  window.requestAnimationFrame(tick);

  startMidiInputService({
    onAvailabilityChange: (available) => {
      store.getState().setMidiAvailability(available);
    },
    onNoteChange: (note, enabled) => {
      if (enabled) {
        activeMidiNotes.add(note);
      } else {
        activeMidiNotes.delete(note);
      }

      store.getState().setMidiInputView({
        activeMidiNotes: [...activeMidiNotes].sort(
          (left, right) => left - right,
        ),
      });

      void playbackEngine.externalMidiNote(note, enabled);
    },
  });
}
