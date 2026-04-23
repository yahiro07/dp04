import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  clampBpm,
  clampOctaveShift,
  createDefaultSong,
  toggleMelodyCell,
} from "./music";
import type {
  BaseBars,
  GrooveboxState,
  LoopCount,
  MachineId,
  PartMachineId,
  PlaybackMode,
  ProgramTarget,
  SceneMachineId,
  SongKey,
  VariationIndex,
} from "./types";

interface GrooveboxActions {
  setBpm: (bpm: number) => void;
  setKey: (songKey: SongKey) => void;
  setAutoAdvanceScenes: (enabled: boolean) => void;
  setCurrentSceneIndex: (sceneIndex: number) => void;
  queueSceneIndex: (sceneIndex: number | null) => void;
  setActiveMachineId: (machineId: MachineId) => void;
  setSceneMachineEnabled: (
    sceneIndex: number,
    machineId: SceneMachineId,
    enabled: boolean,
  ) => void;
  setSceneMachineVariation: (
    sceneIndex: number,
    machineId: SceneMachineId,
    variation: VariationIndex,
  ) => void;
  setSceneBaseBars: (sceneIndex: number, baseBars: BaseBars) => void;
  setSceneLoopCount: (sceneIndex: number, loopCount: LoopCount) => void;
  setProgramAssignment: (target: ProgramTarget, program: number) => void;
  toggleDrumStep: (
    variation: VariationIndex,
    laneIndex: number,
    stepIndex: number,
  ) => void;
  togglePartStep: (
    machineId: PartMachineId,
    variation: VariationIndex,
    laneIndex: number,
    stepIndex: number,
  ) => void;
  setPartOctaveShift: (machineId: PartMachineId, octaveShift: number) => void;
  setRootNoteStep: (
    variation: VariationIndex,
    barIndex: number,
    rootOffset: number,
  ) => void;
  toggleMelodyNote: (
    variation: VariationIndex,
    stepIndex: number,
    midi: number,
  ) => void;
  setMelodyOctaveShift: (octaveShift: number) => void;
  setPlaybackState: (payload: Partial<GrooveboxState["playback"]>) => void;
}

export const useGrooveboxStore = create<GrooveboxState & GrooveboxActions>()(
  persist(
    (set) => ({
      song: createDefaultSong(),
      playback: {
        isPlaying: false,
        playbackMode: "manual",
        activeRootNote: null,
        queuedSceneIndex: null,
        midiAvailable: false,
      },
      setBpm: (bpm) =>
        set((state) => ({
          song: {
            ...state.song,
            bpm: clampBpm(Math.round(bpm)),
          },
        })),
      setKey: (songKey) =>
        set((state) => ({
          song: {
            ...state.song,
            key: songKey,
          },
        })),
      setAutoAdvanceScenes: (enabled) =>
        set((state) => ({
          song: {
            ...state.song,
            autoAdvanceScenes: enabled,
          },
        })),
      setCurrentSceneIndex: (sceneIndex) =>
        set((state) => ({
          song: {
            ...state.song,
            currentSceneIndex: sceneIndex,
          },
        })),
      queueSceneIndex: (sceneIndex) =>
        set((state) => ({
          playback: {
            ...state.playback,
            queuedSceneIndex: sceneIndex,
          },
        })),
      setActiveMachineId: (machineId) =>
        set((state) => ({
          song: {
            ...state.song,
            activeMachineId: machineId,
          },
        })),
      setSceneMachineEnabled: (sceneIndex, machineId, enabled) =>
        set((state) => ({
          song: {
            ...state.song,
            scenes: state.song.scenes.map((scene, currentSceneIndex) =>
              currentSceneIndex === sceneIndex
                ? {
                    ...scene,
                    machines: {
                      ...scene.machines,
                      [machineId]: {
                        ...scene.machines[machineId],
                        enabled,
                      },
                    },
                  }
                : scene,
            ),
          },
        })),
      setSceneMachineVariation: (sceneIndex, machineId, variation) =>
        set((state) => ({
          song: {
            ...state.song,
            scenes: state.song.scenes.map((scene, currentSceneIndex) =>
              currentSceneIndex === sceneIndex
                ? {
                    ...scene,
                    machines: {
                      ...scene.machines,
                      [machineId]: {
                        ...scene.machines[machineId],
                        variation,
                      },
                    },
                  }
                : scene,
            ),
          },
        })),
      setSceneBaseBars: (sceneIndex, baseBars) =>
        set((state) => ({
          song: {
            ...state.song,
            scenes: state.song.scenes.map((scene, currentSceneIndex) =>
              currentSceneIndex === sceneIndex ? { ...scene, baseBars } : scene,
            ),
          },
        })),
      setSceneLoopCount: (sceneIndex, loopCount) =>
        set((state) => ({
          song: {
            ...state.song,
            scenes: state.song.scenes.map((scene, currentSceneIndex) =>
              currentSceneIndex === sceneIndex
                ? { ...scene, loopCount }
                : scene,
            ),
          },
        })),
      setProgramAssignment: (target, program) =>
        set((state) => ({
          song: {
            ...state.song,
            core: {
              ...state.song.core,
              programs: {
                ...state.song.core.programs,
                [target]: program,
              },
            },
          },
        })),
      toggleDrumStep: (variation, laneIndex, stepIndex) =>
        set((state) => ({
          song: {
            ...state.song,
            drums: {
              ...state.song.drums,
              patterns: state.song.drums.patterns.map(
                (pattern, variationIndex) =>
                  variationIndex === variation
                    ? pattern.map((lane, currentLaneIndex) =>
                        currentLaneIndex === laneIndex
                          ? lane.map((value, currentStepIndex) =>
                              currentStepIndex === stepIndex ? !value : value,
                            )
                          : lane,
                      )
                    : pattern,
              ),
            },
          },
        })),
      togglePartStep: (machineId, variation, laneIndex, stepIndex) =>
        set((state) => ({
          song: {
            ...state.song,
            parts: {
              ...state.song.parts,
              [machineId]: {
                ...state.song.parts[machineId],
                patterns: state.song.parts[machineId].patterns.map(
                  (pattern, variationIndex) =>
                    variationIndex === variation
                      ? pattern.map((lane, currentLaneIndex) =>
                          currentLaneIndex === laneIndex
                            ? lane.map((value, currentStepIndex) =>
                                currentStepIndex === stepIndex ? !value : value,
                              )
                            : lane,
                        )
                      : pattern,
                ),
              },
            },
          },
        })),
      setPartOctaveShift: (machineId, octaveShift) =>
        set((state) => ({
          song: {
            ...state.song,
            parts: {
              ...state.song.parts,
              [machineId]: {
                ...state.song.parts[machineId],
                octaveShift: clampOctaveShift(octaveShift),
              },
            },
          },
        })),
      setRootNoteStep: (variation, barIndex, rootOffset) =>
        set((state) => ({
          song: {
            ...state.song,
            root: {
              ...state.song.root,
              patterns: state.song.root.patterns.map(
                (pattern, variationIndex) =>
                  variationIndex === variation
                    ? pattern.map((value, currentBarIndex) =>
                        currentBarIndex === barIndex ? rootOffset : value,
                      )
                    : pattern,
              ),
            },
          },
        })),
      toggleMelodyNote: (variation, stepIndex, midi) =>
        set((state) => ({
          song: {
            ...state.song,
            melody: {
              ...state.song.melody,
              patterns: state.song.melody.patterns.map(
                (notes, variationIndex) =>
                  variationIndex === variation
                    ? toggleMelodyCell(notes, stepIndex, midi)
                    : notes,
              ),
            },
          },
        })),
      setMelodyOctaveShift: (octaveShift) =>
        set((state) => ({
          song: {
            ...state.song,
            melody: {
              ...state.song.melody,
              octaveShift: clampOctaveShift(octaveShift),
            },
          },
        })),
      setPlaybackState: (payload) =>
        set((state) => ({
          playback: {
            ...state.playback,
            ...payload,
          },
        })),
    }),
    {
      name: "groovebox-proto-song",
      partialize: (state) => ({
        song: state.song,
      }),
    },
  ),
);

export function getStoreState() {
  return useGrooveboxStore.getState();
}

export function getStoreActions() {
  const state = useGrooveboxStore.getState();
  return {
    queueSceneIndex: state.queueSceneIndex,
    setCurrentSceneIndex: state.setCurrentSceneIndex,
    setPlaybackState: state.setPlaybackState,
  } satisfies Pick<
    GrooveboxActions,
    "queueSceneIndex" | "setCurrentSceneIndex" | "setPlaybackState"
  >;
}

export function setPlaybackMode(playbackMode: PlaybackMode) {
  useGrooveboxStore.getState().setPlaybackState({ playbackMode });
}
