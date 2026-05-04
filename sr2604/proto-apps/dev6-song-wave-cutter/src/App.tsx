import type { Component } from "solid-js";
import { createSignal, Show } from "solid-js";
import AnalysisDebugView from "./components/AnalysisDebugView";
import PhraseSection from "./components/PhraseSection";
import SongSection from "./components/SongSection";
import type { AnalysisDebugData } from "./modules/audio-analysis";
import { AnalysisError, analyzeAudio } from "./modules/audio-analysis";
import {
  loadAndDecodeFile,
  stopPhrase,
  stopSong,
} from "./modules/audio-player";
import { setStore } from "./store";

export const App: Component = () => {
  const [debugData, setDebugData] = createSignal<AnalysisDebugData | null>(
    null,
  );

  async function loadFile(file: File) {
    // Reset playback state
    stopSong();
    stopPhrase();
    setDebugData(null);
    setStore({
      fileName: file.name,
      isAnalyzing: true,
      analysisError: null,
      bpm: null,
      startSamplesOffset: null,
      songPlaying: false,
      phrasePlaying: false,
    });

    try {
      const audioBuffer = await loadAndDecodeFile(file);
      const result = await analyzeAudio(audioBuffer);
      setDebugData(result.debugData);
      setStore({
        bpm: result.bpm,
        startSamplesOffset: result.startSamplesOffset,
        isAnalyzing: false,
      });
    } catch (err) {
      if (err instanceof AnalysisError && err.debugData) {
        setDebugData(err.debugData);
      }
      setStore({
        analysisError: err instanceof Error ? err.message : String(err),
        isAnalyzing: false,
      });
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];
    if (file) void loadFile(file);
  }

  return (
    <div
      class="min-h-screen p-6 font-mono text-sm"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <SongSection onLoad={(f) => void loadFile(f)} />
      <Show when={debugData()}>
        {(data) => (
          <div class="mb-4">
            <div class="text-xs text-gray-400 mb-1">
              Analysis debug (2 sec, LPF 150 Hz)
            </div>
            <AnalysisDebugView data={data()} />
          </div>
        )}
      </Show>
      <hr class="border-gray-300 my-4" />
      <PhraseSection />
    </div>
  );
};
