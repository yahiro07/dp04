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
  playbackEngine.applySnapshot(createPlaybackSnapshot(initialState.song));
  void playbackEngine.setInputState(
    initialState.playback.intent.heldManualNotes,
    initialState.playback.intent.heldDirectNotes,
  );

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

    if (
      state.playback.intent.heldManualNotes !==
        previousState.playback.intent.heldManualNotes ||
      state.playback.intent.heldDirectNotes !==
        previousState.playback.intent.heldDirectNotes
    ) {
      void playbackEngine.setInputState(
        state.playback.intent.heldManualNotes,
        state.playback.intent.heldDirectNotes,
      );
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
      store.getState().processMidiNote(note, enabled);
    },
  });
}
