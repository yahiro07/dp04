import type { Component } from "solid-js";
import { Show } from "solid-js";
import { getSongBuffer, pauseSong, playSong } from "../modules/audio-player";
import { setStore, store } from "../store";

interface Props {
  onLoad: (file: File) => void;
}

const SongSection: Component<Props> = (props) => {
  let fileInputRef!: HTMLInputElement;

  function handleFileChange(e: Event) {
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    if (file) props.onLoad(file);
    // Reset so the same file can be re-loaded
    (e.currentTarget as HTMLInputElement).value = "";
  }

  function handlePlayPause() {
    if (!getSongBuffer()) return;
    if (store.songPlaying) {
      pauseSong();
      setStore("songPlaying", false);
    } else {
      playSong(() => setStore("songPlaying", false));
      setStore("songPlaying", true);
    }
  }

  const startOffsetSec = () => {
    const offset = store.startSamplesOffset;
    if (offset == null) return null;
    // We need sample rate. Access it from the buffer via audioPlayer.
    const buf = getSongBuffer();
    if (!buf) return null;
    return (offset / buf.sampleRate).toFixed(3);
  };

  const canPlay = () => !!getSongBuffer() && !store.isAnalyzing;

  return (
    <section class="mb-6">
      <h2 class="font-bold mb-2">Song</h2>

      {/* Controls row */}
      <div class="flex items-center gap-2 mb-3">
        <button
          type="button"
          class="px-3 py-1 border border-gray-400 bg-white hover:bg-gray-50 text-sm disabled:opacity-40"
          onClick={() => fileInputRef.click()}
          disabled={store.isAnalyzing}
        >
          load
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/wav,audio/mpeg,audio/mp3,.wav,.mp3"
          class="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          class="px-3 py-1 border border-gray-400 bg-white hover:bg-gray-50 text-sm disabled:opacity-40"
          onClick={handlePlayPause}
          disabled={!canPlay()}
        >
          {store.songPlaying ? "pause" : "play"}
        </button>
      </div>

      {/* Analysis result / error */}
      <div class="text-sm font-mono space-y-1">
        <Show when={store.isAnalyzing}>
          <div class="text-gray-500">Analyzing…</div>
        </Show>

        <Show when={!store.isAnalyzing && store.analysisError}>
          <div class="text-red-600">Error: {store.analysisError}</div>
        </Show>

        <Show when={!store.isAnalyzing && store.bpm != null}>
          <div>
            bpm: <span class="ml-1">{store.bpm}</span>
          </div>
          <div>
            startOffset: <span class="ml-1">{startOffsetSec()} sec</span>
          </div>
        </Show>

        <Show
          when={
            !store.isAnalyzing &&
            store.bpm == null &&
            !store.analysisError &&
            !store.fileName
          }
        >
          <div class="text-gray-400">No file loaded</div>
        </Show>
      </div>
    </section>
  );
};

export default SongSection;
