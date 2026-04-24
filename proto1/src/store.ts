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
  togglePlaybackIntent: () => void;
  requestSceneChange: (sceneIndex: number) => void;
  setMidiAvailability: (midiAvailable: boolean) => void;
  setTransportView: (payload: {
    currentStepIndex: number;
    currentBarIndex: number;
    localStepIndex: number;
  }) => void;
  commitPlaybackSceneAdvance: (sceneIndex: number) => void;
  processMidiNote: (note: number, enabled: boolean) => void;
}

export const useGrooveboxStore = create<GrooveboxState & GrooveboxActions>()(
  persist(
    (set) => ({
      song: createDefaultSong(),
      playback: {
        intent: {
          isPlaying: false,
          queuedSceneIndex: null,
          heldManualNotes: [],
          heldDirectNotes: [],
        },
        runtimeView: {
          midiAvailable: false,
          currentStepIndex: -1,
          currentBarIndex: 0,
          localStepIndex: -1,
        },
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
            intent: {
              ...state.playback.intent,
              queuedSceneIndex: sceneIndex,
            },
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
      togglePlaybackIntent: () =>
        set((state) => ({
          playback: {
            ...state.playback,
            intent: {
              ...state.playback.intent,
              isPlaying: !state.playback.intent.isPlaying,
              queuedSceneIndex: state.playback.intent.isPlaying
                ? null
                : state.playback.intent.queuedSceneIndex,
            },
          },
        })),
      requestSceneChange: (sceneIndex) =>
        set((state) => {
          if (state.playback.intent.isPlaying) {
            return {
              playback: {
                ...state.playback,
                intent: {
                  ...state.playback.intent,
                  queuedSceneIndex: sceneIndex,
                },
              },
            };
          }

          return {
            song: {
              ...state.song,
              currentSceneIndex: sceneIndex,
            },
          };
        }),
      setMidiAvailability: (midiAvailable) =>
        set((state) => ({
          playback: {
            ...state.playback,
            runtimeView: {
              ...state.playback.runtimeView,
              midiAvailable,
            },
          },
        })),
      setTransportView: ({
        currentStepIndex,
        currentBarIndex,
        localStepIndex,
      }) =>
        set((state) => {
          if (
            state.playback.runtimeView.currentStepIndex === currentStepIndex &&
            state.playback.runtimeView.currentBarIndex === currentBarIndex &&
            state.playback.runtimeView.localStepIndex === localStepIndex
          ) {
            return state;
          }

          return {
            playback: {
              ...state.playback,
              runtimeView: {
                ...state.playback.runtimeView,
                currentStepIndex,
                currentBarIndex,
                localStepIndex,
              },
            },
          };
        }),
      commitPlaybackSceneAdvance: (sceneIndex) =>
        set((state) => ({
          song: {
            ...state.song,
            currentSceneIndex: sceneIndex,
          },
          playback: {
            ...state.playback,
            intent: {
              ...state.playback.intent,
              queuedSceneIndex:
                state.playback.intent.queuedSceneIndex === sceneIndex
                  ? null
                  : state.playback.intent.queuedSceneIndex,
            },
          },
        })),
      processMidiNote: (note, enabled) =>
        set((state) => {
          const intentKey = note <= 60 ? "heldManualNotes" : "heldDirectNotes";
          const currentNotes = state.playback.intent[intentKey];
          const nextNotes = enabled
            ? [...currentNotes.filter((value) => value !== note), note]
            : currentNotes.filter((value) => value !== note);

          if (nextNotes === currentNotes) {
            return state;
          }

          return {
            playback: {
              ...state.playback,
              intent: {
                ...state.playback.intent,
                [intentKey]: nextNotes,
              },
            },
          };
        }),
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
