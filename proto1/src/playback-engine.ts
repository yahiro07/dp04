import WebAudioTinySynth from "webaudio-tinysynth";

import {
  getCurrentRootInfo,
  getDrumMidi,
  getMelodyChannel,
  getMelodyNotesAtStep,
  getPartChannel,
  getPartLaneInterval,
  getPartMachineIds,
  getSceneMachineIds,
} from "./music";
import { getStoreState, useGrooveboxStore } from "./store";
import type { PartMachineId, ProgramTarget } from "./types";

class TinySynthAdapter {
  private synth: WebAudioTinySynth | null = null;

  init() {
    if (this.synth || typeof window === "undefined") {
      return;
    }

    this.synth = new WebAudioTinySynth({ quality: 1, useReverb: 1 });
    this.synth.setChVol(9, 110);
    this.applyPrograms(getStoreState().song.core.programs);
  }

  resumeAudio() {
    this.init();
    return this.synth?.actx.resume();
  }

  applyPrograms(programs: Record<ProgramTarget, number>) {
    this.init();
    if (!this.synth) {
      return;
    }

    this.synth.setProgram(0, programs.partA);
    this.synth.setProgram(1, programs.partB);
    this.synth.setProgram(2, programs.partC);
    this.synth.setProgram(3, programs.melody);
  }

  noteOn(
    channel: number,
    note: number,
    velocity: number,
    durationSeconds?: number,
  ) {
    this.init();
    if (!this.synth) {
      return;
    }

    const startTime = this.synth.actx.currentTime;
    this.synth.noteOn(channel, note, velocity, startTime);
    if (durationSeconds) {
      this.synth.noteOff(channel, note, startTime + durationSeconds);
    }
  }

  noteOff(channel: number, note: number) {
    if (!this.synth) {
      return;
    }
    this.synth.noteOff(channel, note, this.synth.actx.currentTime);
  }

  allSoundOff() {
    if (!this.synth) {
      return;
    }
    for (const channel of [0, 1, 2, 3, 9]) {
      this.synth.allSoundOff(channel);
    }
  }
}

class PlaybackEngine {
  private synth = new TinySynthAdapter();
  private initialized = false;
  private timerId: number | null = null;
  private lastStepIndex = -1;
  private lastBarIndex = -1;
  private autoStartMs = 0;
  private manualStartMs = 0;
  private sceneBarsElapsed = 0;
  private heldLowNotes: number[] = [];
  private activeHighNotes = new Set<number>();

  init() {
    if (this.initialized || typeof window === "undefined") {
      return;
    }

    this.initialized = true;
    this.synth.init();
    useGrooveboxStore.subscribe((state, previousState) => {
      if (state.song.core.programs !== previousState.song.core.programs) {
        this.synth.applyPrograms(state.song.core.programs);
      }
    });
    this.connectMidi();
  }

  async togglePlay() {
    this.init();
    await this.synth.resumeAudio();
    const state = getStoreState();

    if (state.playback.isPlaying) {
      this.stopAutoPlayback();
      return;
    }

    this.lastStepIndex = -1;
    this.lastBarIndex = -1;
    this.sceneBarsElapsed = 0;
    this.autoStartMs = performance.now();
    state.setPlaybackState({
      isPlaying: true,
      playbackMode: "auto",
      activeRootNote: null,
      queuedSceneIndex: null,
    });
    this.ensureTimer();
  }

  stopAutoPlayback() {
    const state = getStoreState();
    state.setPlaybackState({
      isPlaying: false,
      queuedSceneIndex: null,
      playbackMode:
        state.playback.activeRootNote === null
          ? "manual"
          : state.playback.playbackMode,
    });
    this.synth.allSoundOff();
    this.lastStepIndex = -1;
    this.lastBarIndex = -1;
    this.sceneBarsElapsed = 0;
    this.stopTimerIfIdle();
  }

  async triggerManualRoot(note: number, enabled: boolean) {
    this.init();
    await this.synth.resumeAudio();

    if (enabled) {
      this.heldLowNotes = [
        ...this.heldLowNotes.filter((value) => value !== note),
        note,
      ];
      this.manualStartMs = performance.now();
      getStoreState().setPlaybackState({
        playbackMode: "manual",
        activeRootNote: note,
      });
      this.lastStepIndex = -1;
      this.lastBarIndex = -1;
      this.ensureTimer();
      return;
    }

    this.heldLowNotes = this.heldLowNotes.filter((value) => value !== note);
    const nextRootNote = this.heldLowNotes.at(-1) ?? null;
    getStoreState().setPlaybackState({
      activeRootNote: nextRootNote,
      playbackMode: "manual",
    });

    if (nextRootNote !== null) {
      this.manualStartMs = performance.now();
      this.lastStepIndex = -1;
      this.lastBarIndex = -1;
    } else {
      this.synth.allSoundOff();
      this.stopTimerIfIdle();
    }
  }

  async handleDirectMelody(note: number, enabled: boolean) {
    this.init();
    await this.synth.resumeAudio();
    const state = getStoreState();
    const shiftedNote = note + state.song.melody.octaveShift * 12;
    const channel = getMelodyChannel();

    if (enabled) {
      this.activeHighNotes.add(shiftedNote);
      this.synth.noteOn(channel, shiftedNote, 100);
      return;
    }

    this.activeHighNotes.delete(shiftedNote);
    this.synth.noteOff(channel, shiftedNote);
  }

  requestSceneChange(sceneIndex: number) {
    const state = getStoreState();
    if (state.playback.isPlaying) {
      state.queueSceneIndex(sceneIndex);
      return;
    }
    state.setCurrentSceneIndex(sceneIndex);
  }

  private ensureTimer() {
    if (this.timerId !== null) {
      return;
    }
    this.timerId = window.setInterval(() => {
      this.processTransport();
    }, 25);
  }

  private stopTimerIfIdle() {
    const state = getStoreState();
    if (state.playback.isPlaying || state.playback.activeRootNote !== null) {
      return;
    }
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private processTransport() {
    const state = getStoreState();
    const now = performance.now();
    const manualActive =
      !state.playback.isPlaying && state.playback.activeRootNote !== null;

    if (!state.playback.isPlaying && !manualActive) {
      return;
    }

    const stepDurationMs = 60000 / state.song.bpm / 4;
    const transportMs = state.playback.isPlaying
      ? now - this.autoStartMs
      : now - this.manualStartMs;
    const stepIndex = Math.floor(transportMs / stepDurationMs);

    if (stepIndex <= this.lastStepIndex) {
      return;
    }

    for (
      let currentStepIndex = this.lastStepIndex + 1;
      currentStepIndex <= stepIndex;
      currentStepIndex += 1
    ) {
      const barIndex = Math.floor(currentStepIndex / 16);
      if (barIndex !== this.lastBarIndex) {
        this.handleBarBoundary(barIndex);
        this.lastBarIndex = barIndex;
      }
      this.triggerStep(currentStepIndex);
    }

    this.lastStepIndex = stepIndex;
  }

  private handleBarBoundary(barIndex: number) {
    const state = getStoreState();

    if (this.lastBarIndex >= 0 && state.playback.isPlaying) {
      this.sceneBarsElapsed += 1;
    }

    if (state.playback.isPlaying && state.playback.queuedSceneIndex !== null) {
      state.setCurrentSceneIndex(state.playback.queuedSceneIndex);
      state.queueSceneIndex(null);
      this.sceneBarsElapsed = 0;
      return;
    }

    if (!state.playback.isPlaying || !state.song.autoAdvanceScenes) {
      return;
    }

    const scene = state.song.scenes[state.song.currentSceneIndex];
    const sceneLengthBars = scene.baseBars * scene.loopCount;
    if (this.sceneBarsElapsed >= sceneLengthBars) {
      state.setCurrentSceneIndex(
        (state.song.currentSceneIndex + 1) % state.song.scenes.length,
      );
      this.sceneBarsElapsed = 0;
      this.lastStepIndex = barIndex * 16 - 1;
    }
  }

  private triggerStep(stepIndex: number) {
    const state = getStoreState();
    const scene = state.song.scenes[state.song.currentSceneIndex];
    const localStep = stepIndex % 16;
    const barIndex = Math.floor(stepIndex / 16);
    const currentRoot = getCurrentRootInfo(
      state.song,
      !state.playback.isPlaying,
      state.playback.activeRootNote,
      barIndex,
    );

    if (!currentRoot) {
      return;
    }

    if (scene.machines.drums.enabled) {
      const drumPattern =
        state.song.drums.patterns[scene.machines.drums.variation];
      for (let laneIndex = 0; laneIndex < drumPattern.length; laneIndex += 1) {
        if (drumPattern[laneIndex][localStep]) {
          this.synth.noteOn(9, getDrumMidi(laneIndex), 110, 0.12);
        }
      }
    }

    for (const machineId of getPartMachineIds()) {
      const sceneMachineState = scene.machines[machineId];
      if (!sceneMachineState.enabled) {
        continue;
      }

      const machineState = state.song.parts[machineId];
      const pattern = machineState.patterns[sceneMachineState.variation];
      for (let laneIndex = 0; laneIndex < pattern.length; laneIndex += 1) {
        if (!pattern[laneIndex][localStep]) {
          continue;
        }

        const interval = getPartLaneInterval(
          state.song.key,
          currentRoot.rootOffset,
          laneIndex,
        );
        const note =
          currentRoot.rootMidi + interval + machineState.octaveShift * 12;
        this.synth.noteOn(getPartChannel(machineId), note, 92, 0.22);
      }
    }

    if (scene.machines.melody.enabled) {
      const melodyPattern =
        state.song.melody.patterns[scene.machines.melody.variation];
      const notes = getMelodyNotesAtStep(melodyPattern, stepIndex % 64);
      for (const note of notes) {
        this.synth.noteOn(
          getMelodyChannel(),
          note.midi + state.song.melody.octaveShift * 12,
          98,
          (note.durationSteps * (60000 / state.song.bpm / 4)) / 1000,
        );
      }
    }
  }

  private connectMidi() {
    if (
      typeof navigator === "undefined" ||
      !("requestMIDIAccess" in navigator)
    ) {
      getStoreState().setPlaybackState({ midiAvailable: false });
      return;
    }

    navigator
      .requestMIDIAccess()
      .then((midiAccess) => {
        getStoreState().setPlaybackState({
          midiAvailable: midiAccess.inputs.size > 0,
        });
        for (const input of midiAccess.inputs.values()) {
          input.onmidimessage = (event) => {
            if (event.data) {
              void this.handleMidiMessage(event.data);
            }
          };
        }
        midiAccess.onstatechange = () => {
          const inputs = Array.from(midiAccess.inputs.values());
          getStoreState().setPlaybackState({
            midiAvailable: inputs.length > 0,
          });
          for (const input of inputs) {
            input.onmidimessage = (event) => {
              if (event.data) {
                void this.handleMidiMessage(event.data);
              }
            };
          }
        };
      })
      .catch(() => {
        getStoreState().setPlaybackState({ midiAvailable: false });
      });
  }

  private async handleMidiMessage(data: Uint8Array) {
    const [status, note, velocity] = data;
    const messageType = status & 0xf0;
    const isNoteOn = messageType === 0x90 && velocity > 0;
    const isNoteOff =
      messageType === 0x80 || (messageType === 0x90 && velocity === 0);

    if (!isNoteOn && !isNoteOff) {
      return;
    }

    if (note <= 60) {
      await this.triggerManualRoot(note, isNoteOn);
      return;
    }

    await this.handleDirectMelody(note, isNoteOn);
  }
}

export const playbackEngine = new PlaybackEngine();

export function getMachineSceneState(
  machineId: PartMachineId | "drums" | "root" | "melody",
) {
  const scene =
    getStoreState().song.scenes[getStoreState().song.currentSceneIndex];
  return scene.machines[machineId];
}

export function getVisibleSceneSummary() {
  const state = getStoreState();
  const scene = state.song.scenes[state.song.currentSceneIndex];
  return getSceneMachineIds().map((machineId) => ({
    machineId,
    enabled: scene.machines[machineId].enabled,
    variation: scene.machines[machineId].variation,
  }));
}
