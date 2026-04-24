export type SongKey = "Am" | "C";

export type SceneMachineId =
  | "drums"
  | "partA"
  | "partB"
  | "partC"
  | "root"
  | "melody";

export type MachineId = "core" | SceneMachineId;

export type BaseBars = 1 | 2 | 4 | 8 | 16;
export type LoopCount = 1 | 2 | 4;
export type VariationIndex = 0 | 1 | 2 | 3;
export type PartMachineId = "partA" | "partB" | "partC";
export type ProgramTarget = PartMachineId | "melody";
export type PlaybackMode = "manual" | "auto";

export interface SceneMachineState {
  enabled: boolean;
  variation: VariationIndex;
}

export interface SceneState {
  baseBars: BaseBars;
  loopCount: LoopCount;
  machines: Record<SceneMachineId, SceneMachineState>;
}

export interface CoreMachineState {
  programs: Record<ProgramTarget, number>;
}

export interface DrumMachineState {
  patterns: boolean[][][];
}

export interface PartMachineState {
  patterns: boolean[][][];
  octaveShift: number;
}

export interface RootMachineState {
  patterns: number[][];
}

export interface MelodyNote {
  midi: number;
  step: number;
  durationSteps: number;
}

export interface MelodyMachineState {
  patterns: MelodyNote[][];
  octaveShift: number;
}

export interface SongState {
  bpm: number;
  key: SongKey;
  autoAdvanceScenes: boolean;
  currentSceneIndex: number;
  activeMachineId: MachineId;
  core: CoreMachineState;
  drums: DrumMachineState;
  parts: Record<PartMachineId, PartMachineState>;
  root: RootMachineState;
  melody: MelodyMachineState;
  scenes: SceneState[];
}

export interface PlaybackIntentState {
  isPlaying: boolean;
  queuedSceneIndex: number | null;
  heldManualNotes: number[];
  heldDirectNotes: number[];
}

export interface PlaybackRuntimeViewState {
  midiAvailable: boolean;
  currentStepIndex: number;
  currentBarIndex: number;
  localStepIndex: number;
}

export interface PlaybackState {
  intent: PlaybackIntentState;
  runtimeView: PlaybackRuntimeViewState;
}

export interface GrooveboxState {
  song: SongState;
  playback: PlaybackState;
}

export interface PlaybackSnapshot {
  bpm: number;
  key: SongKey;
  autoAdvanceScenes: boolean;
  currentSceneIndex: number;
  scenes: SceneState[];
  programs: Record<ProgramTarget, number>;
  drums: boolean[][][];
  parts: Record<PartMachineId, PartMachineState>;
  root: RootMachineState;
  melody: MelodyMachineState;
}

export interface PlaybackTransportState {
  isRunning: boolean;
  sceneIndex: number;
  stepIndex: number;
  barIndex: number;
  localStepIndex: number;
}

export interface SceneAdvancedEvent {
  type: "scene-advanced";
  sceneIndex: number;
  previousSceneIndex: number;
  reason: "queued" | "auto";
  atMs: number;
}

export type PlaybackEvent = SceneAdvancedEvent;
