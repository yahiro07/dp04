import { useGroovebox } from "../context/groovebox-context";
import { primaryButtonClass, sceneButtonClass } from "../lib/groovebox-ui";
import type { SongKey } from "../types";

export function GrooveboxHeader() {
  const {
    playback,
    song,
    requestSceneChange,
    setAutoAdvanceScenes,
    setBpm,
    setKey,
    togglePlay,
  } = useGroovebox();

  return (
    <header className="grid grid-cols-[auto_auto_auto_1fr] gap-4 border-b border-stone-800 bg-stone-900/95 px-5 py-4">
      <button
        className={primaryButtonClass(playback.isPlaying)}
        onClick={togglePlay}
        type="button"
      >
        {playback.isPlaying ? "Stop" : "Play"}
      </button>
      <div className="flex items-center gap-2 rounded-2xl border border-stone-800 bg-stone-950/60 px-3 py-2">
        <span className="text-xs uppercase tracking-[0.24em] text-stone-400">
          BPM
        </span>
        <input
          className="w-24 accent-amber-500"
          max={180}
          min={60}
          onChange={(event) => {
            setBpm(Number(event.target.value));
          }}
          type="range"
          value={song.bpm}
        />
        <span className="w-9 text-right font-mono text-sm">{song.bpm}</span>
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-stone-800 bg-stone-950/60 px-3 py-2">
        <label
          className="text-xs uppercase tracking-[0.24em] text-stone-400"
          htmlFor="song-key"
        >
          Key
        </label>
        <select
          className="rounded-lg border border-stone-700 bg-stone-900 px-2 py-1 text-sm"
          id="song-key"
          onChange={(event) => {
            setKey(event.target.value as SongKey);
          }}
          value={song.key}
        >
          <option value="Am">Am</option>
          <option value="C">C</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <label className="flex items-center gap-2 rounded-2xl border border-stone-800 bg-stone-950/60 px-3 py-2 text-sm text-stone-200">
          <input
            checked={song.autoAdvanceScenes}
            className="accent-amber-500"
            onChange={(event) => {
              setAutoAdvanceScenes(event.target.checked);
            }}
            type="checkbox"
          />
          Auto Scene
        </label>
        {song.scenes.map((_, sceneIndex) => {
          const isActive = song.currentSceneIndex === sceneIndex;
          const isQueued = playback.queuedSceneIndex === sceneIndex;
          return (
            <button
              className={sceneButtonClass(isActive, isQueued)}
              key={`scene-${sceneIndex + 1}`}
              onClick={() => {
                requestSceneChange(sceneIndex);
              }}
              type="button"
            >
              {sceneIndex + 1}
            </button>
          );
        })}
      </div>
    </header>
  );
}
