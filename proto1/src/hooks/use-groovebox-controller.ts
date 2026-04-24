import { useMemo } from "react";

import { playbackEngine } from "../playback-engine";
import { useGrooveboxStore } from "../store";
import type {
  BaseBars,
  LoopCount,
  MachineId,
  PartMachineId,
  ProgramTarget,
  SongKey,
  VariationIndex,
} from "../types";

export function useGrooveboxController() {
  const song = useGrooveboxStore((state) => state.song);
  const playback = useGrooveboxStore((state) => state.playback);
  const setBpm = useGrooveboxStore((state) => state.setBpm);
  const setKey = useGrooveboxStore((state) => state.setKey);
  const setAutoAdvanceScenes = useGrooveboxStore(
    (state) => state.setAutoAdvanceScenes,
  );
  const setActiveMachineId = useGrooveboxStore(
    (state) => state.setActiveMachineId,
  );
  const setSceneMachineEnabled = useGrooveboxStore(
    (state) => state.setSceneMachineEnabled,
  );
  const setSceneMachineVariation = useGrooveboxStore(
    (state) => state.setSceneMachineVariation,
  );
  const setSceneBaseBars = useGrooveboxStore((state) => state.setSceneBaseBars);
  const setSceneLoopCount = useGrooveboxStore(
    (state) => state.setSceneLoopCount,
  );
  const setProgramAssignment = useGrooveboxStore(
    (state) => state.setProgramAssignment,
  );
  const toggleDrumStep = useGrooveboxStore((state) => state.toggleDrumStep);
  const togglePartStep = useGrooveboxStore((state) => state.togglePartStep);
  const setPartOctaveShift = useGrooveboxStore(
    (state) => state.setPartOctaveShift,
  );
  const setRootNoteStep = useGrooveboxStore((state) => state.setRootNoteStep);
  const toggleMelodyNote = useGrooveboxStore((state) => state.toggleMelodyNote);
  const setMelodyOctaveShift = useGrooveboxStore(
    (state) => state.setMelodyOctaveShift,
  );

  const currentScene = song.scenes[song.currentSceneIndex];

  return useMemo(
    () => ({
      song,
      playback,
      currentScene,
      togglePlay: () => {
        void playbackEngine.togglePlay();
      },
      requestSceneChange: (sceneIndex: number) => {
        playbackEngine.requestSceneChange(sceneIndex);
      },
      setBpm: (bpm: number) => {
        setBpm(bpm);
      },
      setKey: (songKey: SongKey) => {
        setKey(songKey);
      },
      setAutoAdvanceScenes: (enabled: boolean) => {
        setAutoAdvanceScenes(enabled);
      },
      setActiveMachineId: (machineId: MachineId) => {
        setActiveMachineId(machineId);
      },
      setSceneMachineEnabled: (machineId: MachineId, enabled: boolean) => {
        if (machineId === "core") {
          return;
        }
        setSceneMachineEnabled(song.currentSceneIndex, machineId, enabled);
      },
      setSceneMachineVariation: (
        machineId: MachineId,
        variation: VariationIndex,
      ) => {
        if (machineId === "core") {
          return;
        }
        setSceneMachineVariation(song.currentSceneIndex, machineId, variation);
      },
      setSceneBaseBars: (baseBars: BaseBars) => {
        setSceneBaseBars(song.currentSceneIndex, baseBars);
      },
      setSceneLoopCount: (loopCount: LoopCount) => {
        setSceneLoopCount(song.currentSceneIndex, loopCount);
      },
      setProgramAssignment: (target: ProgramTarget, program: number) => {
        setProgramAssignment(target, program);
      },
      toggleDrumStep: (
        variation: VariationIndex,
        laneIndex: number,
        stepIndex: number,
      ) => {
        toggleDrumStep(variation, laneIndex, stepIndex);
      },
      togglePartStep: (
        machineId: PartMachineId,
        variation: VariationIndex,
        laneIndex: number,
        stepIndex: number,
      ) => {
        togglePartStep(machineId, variation, laneIndex, stepIndex);
      },
      setPartOctaveShift: (machineId: PartMachineId, octaveShift: number) => {
        setPartOctaveShift(machineId, octaveShift);
      },
      setRootNoteStep: (
        variation: VariationIndex,
        barIndex: number,
        rootOffset: number,
      ) => {
        setRootNoteStep(variation, barIndex, rootOffset);
      },
      toggleMelodyNote: (
        variation: VariationIndex,
        stepIndex: number,
        midi: number,
      ) => {
        toggleMelodyNote(variation, stepIndex, midi);
      },
      setMelodyOctaveShift: (octaveShift: number) => {
        setMelodyOctaveShift(octaveShift);
      },
    }),
    [
      currentScene,
      playback,
      setActiveMachineId,
      setAutoAdvanceScenes,
      setBpm,
      setKey,
      setMelodyOctaveShift,
      setPartOctaveShift,
      setProgramAssignment,
      setRootNoteStep,
      setSceneBaseBars,
      setSceneLoopCount,
      setSceneMachineEnabled,
      setSceneMachineVariation,
      song,
      toggleDrumStep,
      toggleMelodyNote,
      togglePartStep,
    ],
  );
}

export type GrooveboxController = ReturnType<typeof useGrooveboxController>;
