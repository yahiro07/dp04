import type { PlaybackSnapshot, SongState } from "../types";

export function createPlaybackSnapshot(song: SongState): PlaybackSnapshot {
  return {
    bpm: song.bpm,
    key: song.key,
    autoAdvanceScenes: song.autoAdvanceScenes,
    currentSceneIndex: song.currentSceneIndex,
    scenes: song.scenes,
    programs: song.core.programs,
    drums: song.drums.patterns,
    parts: song.parts,
    root: song.root,
    melody: song.melody,
  };
}
