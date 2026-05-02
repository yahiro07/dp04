export interface AudioClip {
  fileName: string;
  buffer: AudioBuffer;
  sampleRate: number;
  totalSamples: number;
  durationSeconds: number;
  channelData: Float32Array[];
  monoData: Float32Array;
}

export interface SelectionRange {
  startBar: number;
  length: number;
}

export interface WaveformBar {
  barIndex: number;
  envelope: number[];
  hasAudio: boolean;
}

export interface AppState {
  audioClip: AudioClip | null;
  bpm: number;
  appliedBpm: number | null;
  draftOffsetSamples: number;
  appliedOffsetSamples: number | null;
  previewEnvelope: number[];
  previewBeatLineRatios: number[];
  waveformBars: WaveformBar[];
  selection: SelectionRange | null;
  isLoading: boolean;
  errorMessage: string;
}
