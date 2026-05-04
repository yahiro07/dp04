import type { Component } from "solid-js";
import { Show } from "solid-js";
import { exportMp3, exportWav } from "../modules/audio-export";
import { getSongBuffer, playPhrase, stopPhrase } from "../modules/audio-player";
import { BAR_LENGTH_OPTIONS, setStore, store } from "../store";
import BarLengthSelector from "./BarLengthSelector";
import DraggableNumber from "./DraggableNumber";

/** Compute the phrase start sample and duration in samples from current store state. */
function computePhrase(
  buffer: AudioBuffer,
  bpm: number,
  startSamplesOffset: number,
) {
  const sampleRate = buffer.sampleRate;
  const samplesPerBar = Math.round(((4 * 60) / bpm) * sampleRate);

  const offsetBarLen = BAR_LENGTH_OPTIONS[store.offsetBarLengthIdx];
  const durBarLen = BAR_LENGTH_OPTIONS[store.durationBarLengthIdx];

  const offsetSamples = Math.round(
    store.offsetN * offsetBarLen * samplesPerBar,
  );
  const durationSamples = Math.round(durBarLen * samplesPerBar);
  const startSample = startSamplesOffset + offsetSamples;

  return { startSample, durationSamples };
}

const PhraseSection: Component = () => {
  const ready = () => store.bpm != null && store.startSamplesOffset != null;

  function handlePlayPause() {
    const buf = getSongBuffer();
    if (!buf || store.bpm == null || store.startSamplesOffset == null) return;

    if (store.phrasePlaying) {
      stopPhrase();
      setStore("phrasePlaying", false);
    } else {
      const { startSample, durationSamples } = computePhrase(
        buf,
        store.bpm,
        store.startSamplesOffset,
      );
      playPhrase(buf, startSample, durationSamples, store.phraseLoop, () => {
        setStore("phrasePlaying", false);
      });
      setStore("phrasePlaying", true);
    }
  }

  function handleExportWav() {
    const buf = getSongBuffer();
    if (
      !buf ||
      store.bpm == null ||
      store.startSamplesOffset == null ||
      !store.fileName
    )
      return;
    const { startSample, durationSamples } = computePhrase(
      buf,
      store.bpm,
      store.startSamplesOffset,
    );
    exportWav(
      buf,
      startSample,
      durationSamples,
      store.fileName,
      store.offsetN,
      store.offsetBarLengthIdx,
      store.durationBarLengthIdx,
    );
  }

  function handleExportMp3() {
    const buf = getSongBuffer();
    if (
      !buf ||
      store.bpm == null ||
      store.startSamplesOffset == null ||
      !store.fileName
    )
      return;
    const { startSample, durationSamples } = computePhrase(
      buf,
      store.bpm,
      store.startSamplesOffset,
    );
    exportMp3(
      buf,
      startSample,
      durationSamples,
      store.fileName,
      store.offsetN,
      store.offsetBarLengthIdx,
      store.durationBarLengthIdx,
    );
  }

  return (
    <section>
      <h2 class="font-bold mb-2">Phrase</h2>

      <Show
        when={ready()}
        fallback={
          <div class="text-sm text-gray-400">Load and analyze a song first</div>
        }
      >
        {/* offset row */}
        <div class="flex items-center gap-2 mb-2 text-sm">
          <span class="w-20">offset :</span>
          <BarLengthSelector
            index={store.offsetBarLengthIdx}
            onChange={(i) => setStore("offsetBarLengthIdx", i)}
          />
          <span>×</span>
          <DraggableNumber
            value={store.offsetN}
            min={0}
            onChange={(v) => setStore("offsetN", v)}
          />
        </div>

        {/* duration row */}
        <div class="flex items-center gap-2 mb-3 text-sm">
          <span class="w-20">duration :</span>
          <BarLengthSelector
            index={store.durationBarLengthIdx}
            onChange={(i) => setStore("durationBarLengthIdx", i)}
          />
        </div>

        {/* playback controls */}
        <div class="flex items-center gap-3 mb-3">
          <button
            type="button"
            class="px-3 py-1 border border-gray-400 bg-white hover:bg-gray-50 text-sm"
            onClick={handlePlayPause}
          >
            {store.phrasePlaying ? "pause" : "play"}
          </button>

          <label class="flex items-center gap-1 text-sm select-none cursor-pointer">
            <input
              type="checkbox"
              checked={store.phraseLoop}
              onChange={(e) => {
                setStore("phraseLoop", e.currentTarget.checked);
                // If currently playing, restart with new loop setting
                if (store.phrasePlaying) {
                  const buf = getSongBuffer();
                  if (
                    buf &&
                    store.bpm != null &&
                    store.startSamplesOffset != null
                  ) {
                    const { startSample, durationSamples } = computePhrase(
                      buf,
                      store.bpm,
                      store.startSamplesOffset,
                    );
                    stopPhrase();
                    playPhrase(
                      buf,
                      startSample,
                      durationSamples,
                      e.currentTarget.checked,
                      () => {
                        setStore("phrasePlaying", false);
                      },
                    );
                  }
                }
              }}
            />
            loop
          </label>
        </div>

        {/* export buttons */}
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-3 py-1 border border-gray-400 bg-white hover:bg-gray-50 text-sm"
            onClick={handleExportWav}
          >
            export wav
          </button>
          <button
            type="button"
            class="px-3 py-1 border border-gray-400 bg-white hover:bg-gray-50 text-sm"
            onClick={handleExportMp3}
          >
            export mp3
          </button>
        </div>
      </Show>
    </section>
  );
};

export default PhraseSection;
