import { createStore } from "solid-js/store";

export const BAR_LENGTH_OPTIONS = [0.25, 0.5, 1, 2, 4, 8, 16] as const;
export type BarLength = (typeof BAR_LENGTH_OPTIONS)[number];

export function barLengthLabel(v: number): string {
  if (v === 0.25) return "1/4";
  if (v === 0.5) return "1/2";
  return String(v);
}

export interface AppState {
  fileName: string | null;
  bpm: number | null;
  startSamplesOffset: number | null;
  analysisError: string | null;
  isAnalyzing: boolean;
  songPlaying: boolean;
  offsetBarLengthIdx: number;
  offsetN: number;
  durationBarLengthIdx: number;
  phraseLoop: boolean;
  phrasePlaying: boolean;
}

export const [store, setStore] = createStore<AppState>({
  fileName: null,
  bpm: null,
  startSamplesOffset: null,
  analysisError: null,
  isAnalyzing: false,
  songPlaying: false,
  offsetBarLengthIdx: 2, // 1 bar
  offsetN: 0,
  durationBarLengthIdx: 2, // 1 bar
  phraseLoop: true,
  phrasePlaying: false,
});
