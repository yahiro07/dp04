import WebAudioTinySynth from "webaudio-tinysynth";

import {
  getCurrentRootInfo,
  getDrumMidi,
  getMelodyChannel,
  getMelodyNotesAtStep,
  getPartChannel,
  getPartLaneInterval,
  getPartMachineIds,
} from "./music";
import type {
  PlaybackEvent,
  PlaybackSnapshot,
  PlaybackTransportState,
  ProgramTarget,
} from "./types";

class TinySynthAdapter {
  private synth: WebAudioTinySynth | null = null;

  init() {
    if (this.synth || typeof window === "undefined") {
      return;
    }

    this.synth = new WebAudioTinySynth({ quality: 1, useReverb: 1 });
    this.synth.setChVol(9, 110);
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
  private snapshot: PlaybackSnapshot | null = null;
  private autoPlaying = false;
  private timerId: number | null = null;
  private lastStepIndex = -1;
  private lastBarIndex = -1;
  private autoStartMs = 0;
  private manualStartMs = 0;
  private sceneBarsElapsed = 0;
  private heldLowNotes: number[] = [];
  private activeHighNotes = new Map<number, number>();
  private currentSceneIndex = 0;
  private queuedSceneIndex: number | null = null;
  private events: PlaybackEvent[] = [];

  init() {
    if (this.initialized || typeof window === "undefined") {
      return;
    }

    this.initialized = true;
    this.synth.init();
  }

  applySnapshot(snapshot: PlaybackSnapshot) {
    this.snapshot = snapshot;
    this.currentSceneIndex = snapshot.currentSceneIndex;
    this.synth.applyPrograms(snapshot.programs);
  }

  async play() {
    this.init();
    await this.synth.resumeAudio();
    if (!this.snapshot) {
      return;
    }

    this.lastStepIndex = -1;
    this.lastBarIndex = -1;
    this.sceneBarsElapsed = 0;
    this.autoPlaying = true;
    this.autoStartMs = performance.now();
    this.currentSceneIndex = this.snapshot.currentSceneIndex;
    this.ensureTimer();
  }

  stop() {
    this.autoPlaying = false;
    this.queuedSceneIndex = null;
    this.lastStepIndex = -1;
    this.lastBarIndex = -1;
    this.sceneBarsElapsed = 0;
    if (this.heldLowNotes.length === 0 && this.activeHighNotes.size === 0) {
      this.synth.allSoundOff();
    }
    this.stopTimerIfIdle();
  }

  setQueuedScene(sceneIndex: number | null) {
    this.queuedSceneIndex = sceneIndex;
  }

  async setInputState(heldLowNotes: number[], heldHighNotes: number[]) {
    this.init();
    const previousRootNote = this.heldLowNotes.at(-1) ?? null;
    const nextRootNote = heldLowNotes.at(-1) ?? null;
    const addedHighNotes = heldHighNotes.filter(
      (note) => !this.activeHighNotes.has(note),
    );
    const removedHighNotes = [...this.activeHighNotes.keys()].filter(
      (note) => !heldHighNotes.includes(note),
    );

    if (
      nextRootNote !== null ||
      addedHighNotes.length > 0 ||
      removedHighNotes.length > 0
    ) {
      await this.synth.resumeAudio();
    }

    this.heldLowNotes = [...heldLowNotes];

    if (nextRootNote !== previousRootNote && nextRootNote !== null) {
      this.manualStartMs = performance.now();
      this.lastStepIndex = -1;
      this.lastBarIndex = -1;
      this.ensureTimer();
    }

    if (nextRootNote === null && this.heldLowNotes.length === 0) {
      this.lastStepIndex = -1;
      this.lastBarIndex = -1;
      this.stopTimerIfIdle();
    }

    for (const note of addedHighNotes) {
      const shiftedNote = note + (this.snapshot?.melody.octaveShift ?? 0) * 12;
      this.activeHighNotes.set(note, shiftedNote);
      this.synth.noteOn(getMelodyChannel(), shiftedNote, 100);
    }

    for (const note of removedHighNotes) {
      const shiftedNote = this.activeHighNotes.get(note);
      this.activeHighNotes.delete(note);
      if (shiftedNote !== undefined) {
        this.synth.noteOff(getMelodyChannel(), shiftedNote);
      }
    }

    if (nextRootNote === null && this.activeHighNotes.size === 0) {
      this.synth.allSoundOff();
      this.stopTimerIfIdle();
    }
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
    if (this.isAutoPlaying() || this.heldLowNotes.length > 0) {
      return;
    }
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private processTransport() {
    if (!this.snapshot) {
      return;
    }

    const now = performance.now();
    const manualActive = !this.isAutoPlaying() && this.heldLowNotes.length > 0;

    if (!this.isAutoPlaying() && !manualActive) {
      return;
    }

    const stepDurationMs = 60000 / this.snapshot.bpm / 4;
    const transportMs = this.isAutoPlaying()
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
    if (!this.snapshot) {
      return;
    }

    if (this.lastBarIndex >= 0 && this.isAutoPlaying()) {
      this.sceneBarsElapsed += 1;
    }

    if (this.isAutoPlaying() && this.queuedSceneIndex !== null) {
      const previousSceneIndex = this.currentSceneIndex;
      this.currentSceneIndex = this.queuedSceneIndex;
      this.queuedSceneIndex = null;
      this.sceneBarsElapsed = 0;
      this.events.push({
        type: "scene-advanced",
        sceneIndex: this.currentSceneIndex,
        previousSceneIndex,
        reason: "queued",
        atMs: performance.now(),
      });
      return;
    }

    if (!this.isAutoPlaying() || !this.snapshot.autoAdvanceScenes) {
      return;
    }

    const scene = this.snapshot.scenes[this.currentSceneIndex];
    const sceneLengthBars = scene.baseBars * scene.loopCount;
    if (this.sceneBarsElapsed >= sceneLengthBars) {
      const previousSceneIndex = this.currentSceneIndex;
      this.currentSceneIndex =
        (this.currentSceneIndex + 1) % this.snapshot.scenes.length;
      this.sceneBarsElapsed = 0;
      this.lastStepIndex = barIndex * 16 - 1;
      this.events.push({
        type: "scene-advanced",
        sceneIndex: this.currentSceneIndex,
        previousSceneIndex,
        reason: "auto",
        atMs: performance.now(),
      });
    }
  }

  private triggerStep(stepIndex: number) {
    if (!this.snapshot) {
      return;
    }

    const scene = this.snapshot.scenes[this.currentSceneIndex];
    const localStep = stepIndex % 16;
    const barIndex = Math.floor(stepIndex / 16);
    const currentRoot = getCurrentRootInfo(
      {
        key: this.snapshot.key,
        currentSceneIndex: this.currentSceneIndex,
        scenes: this.snapshot.scenes,
        root: this.snapshot.root,
      },
      !this.isAutoPlaying(),
      this.heldLowNotes.at(-1) ?? null,
      barIndex,
    );

    if (!currentRoot) {
      return;
    }

    if (scene.machines.drums.enabled) {
      const drumPattern = this.snapshot.drums[scene.machines.drums.variation];
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

      const machineState = this.snapshot.parts[machineId];
      const pattern = machineState.patterns[sceneMachineState.variation];
      for (let laneIndex = 0; laneIndex < pattern.length; laneIndex += 1) {
        if (!pattern[laneIndex][localStep]) {
          continue;
        }

        const interval = getPartLaneInterval(
          this.snapshot.key,
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
        this.snapshot.melody.patterns[scene.machines.melody.variation];
      const notes = getMelodyNotesAtStep(melodyPattern, stepIndex % 64);
      for (const note of notes) {
        this.synth.noteOn(
          getMelodyChannel(),
          note.midi + this.snapshot.melody.octaveShift * 12,
          98,
          (note.durationSteps * (60000 / this.snapshot.bpm / 4)) / 1000,
        );
      }
    }
  }

  drainEvents() {
    const events = [...this.events];
    this.events = [];
    return events;
  }

  getTransportState(): PlaybackTransportState {
    return {
      isRunning: this.isAutoPlaying() || this.heldLowNotes.length > 0,
      sceneIndex: this.currentSceneIndex,
      stepIndex: this.lastStepIndex,
      barIndex: Math.max(this.lastBarIndex, 0),
      localStepIndex: this.lastStepIndex >= 0 ? this.lastStepIndex % 16 : -1,
    };
  }

  private isAutoPlaying() {
    return this.autoPlaying;
  }
}

export const playbackEngine = new PlaybackEngine();
