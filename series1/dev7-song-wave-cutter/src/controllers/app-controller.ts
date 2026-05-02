import { createStore } from "solid-js/store";
import { configs } from "../configs";
import { audioEngine } from "../lib/audio-engine";
import {
  clamp,
  clampBpm,
  getMaxDraftOffsetSamples,
  getSelectionSampleWindow,
} from "../lib/audio-utils";
import { exportMp3Segment } from "../lib/export-mp3";
import { registerTapTempo } from "../lib/tap-tempo";
import {
  buildPreviewBeatLineRatios,
  buildPreviewEnvelope,
  buildWaveformBars,
} from "../lib/waveform-data";
import type { AppState, AudioClip, SelectionRange } from "../types";

const buildInitialState = (): AppState => {
  return {
    audioClip: null,
    bpm: configs.defaultBpm,
    appliedBpm: null,
    draftOffsetSamples: 0,
    appliedOffsetSamples: null,
    previewEnvelope: [],
    previewBeatLineRatios: [],
    waveformBars: [],
    selection: null,
    isLoading: false,
    errorMessage: "",
  };
};

const buildPreviewGuides = (
  audioClip: AudioClip,
  bpm: number,
  draftOffsetSamples: number,
) => {
  return buildPreviewBeatLineRatios(audioClip, bpm, draftOffsetSamples);
};

export const createAppController = () => {
  const [state, setState] = createStore(buildInitialState());
  let tapTimes: number[] = [];

  const updatePreviewGuides = (nextBpm: number, nextOffsetSamples: number) => {
    if (!state.audioClip) {
      return;
    }

    setState(
      "previewBeatLineRatios",
      buildPreviewGuides(state.audioClip, nextBpm, nextOffsetSamples),
    );
  };

  const stopPlayback = () => {
    audioEngine.stopPlayback();
  };

  const selectRange = (selection: SelectionRange) => {
    setState("selection", selection);
  };

  const playSelection = async (selection: SelectionRange, loop: boolean) => {
    if (
      !state.audioClip ||
      state.appliedBpm === null ||
      state.appliedOffsetSamples === null
    ) {
      return;
    }

    const sampleWindow = getSelectionSampleWindow(
      state.audioClip,
      state.appliedOffsetSamples,
      state.appliedBpm,
      selection,
    );

    await audioEngine.playSegment(
      state.audioClip,
      sampleWindow.startSample,
      sampleWindow.endSample,
      loop,
    );
  };

  const loadAudioFile = async (file: File) => {
    setState("isLoading", true);
    setState("errorMessage", "");
    stopPlayback();

    try {
      const audioClip = await audioEngine.decodeAudioFile(file);
      setState({
        audioClip,
        draftOffsetSamples: 0,
        appliedOffsetSamples: null,
        appliedBpm: null,
        previewEnvelope: buildPreviewEnvelope(audioClip),
        previewBeatLineRatios: buildPreviewGuides(audioClip, state.bpm, 0),
        waveformBars: [],
        selection: null,
        errorMessage: "",
      });
    } catch (error) {
      setState(
        "errorMessage",
        error instanceof Error ? error.message : "audio load failed",
      );
    } finally {
      setState("isLoading", false);
    }
  };

  const adjustBpm = (deltaSteps: number) => {
    if (!deltaSteps) {
      return;
    }

    const nextBpm = clampBpm(state.bpm + deltaSteps);
    setState("bpm", nextBpm);
    updatePreviewGuides(nextBpm, state.draftOffsetSamples);
  };

  const tapBpm = () => {
    const tapResult = registerTapTempo(tapTimes, performance.now());
    tapTimes = tapResult.tapTimes;

    if (tapResult.bpm) {
      setState("bpm", tapResult.bpm);
      updatePreviewGuides(tapResult.bpm, state.draftOffsetSamples);
    }
  };

  const setDraftOffsetFromRatio = (ratio: number) => {
    if (!state.audioClip) {
      return;
    }

    const maxDraftOffsetSamples = getMaxDraftOffsetSamples(state.audioClip);
    const nextOffsetSamples = Math.round(
      clamp(ratio, 0, 1) * maxDraftOffsetSamples,
    );
    setState("draftOffsetSamples", nextOffsetSamples);
    updatePreviewGuides(state.bpm, nextOffsetSamples);
  };

  const applyDraftSettings = () => {
    if (!state.audioClip) {
      return;
    }

    setState({
      appliedOffsetSamples: state.draftOffsetSamples,
      appliedBpm: state.bpm,
      waveformBars: buildWaveformBars(
        state.audioClip,
        state.draftOffsetSamples,
        state.bpm,
      ),
      selection: null,
    });
    stopPlayback();
  };

  const playSelectionOnce = async (selection: SelectionRange) => {
    selectRange(selection);
    await playSelection(selection, false);
  };

  const startSelectionLoop = async (selection: SelectionRange) => {
    selectRange(selection);
    await playSelection(selection, true);
  };

  const exportSelection = async () => {
    if (
      !state.audioClip ||
      state.appliedBpm === null ||
      state.appliedOffsetSamples === null ||
      !state.selection
    ) {
      return;
    }

    const sampleWindow = getSelectionSampleWindow(
      state.audioClip,
      state.appliedOffsetSamples,
      state.appliedBpm,
      state.selection,
    );

    await exportMp3Segment(
      state.audioClip,
      sampleWindow.startSample,
      sampleWindow.endSample,
      state.selection.startBar,
      state.selection.length,
    );
  };

  return {
    state,
    actions: {
      loadAudioFile,
      adjustBpm,
      tapBpm,
      setDraftOffsetFromRatio,
      applyDraftSettings,
      selectRange,
      playSelectionOnce,
      startSelectionLoop,
      stopPlayback,
      exportSelection,
    },
  };
};
