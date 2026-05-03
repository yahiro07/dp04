export const configs = {
  defaultBpm: 120,
  bpmMin: 40,
  bpmMax: 240,
  bpmDragPixelsPerStep: 7,
  previewSeconds: 2,
  displayMaxBars: 96,
  barsPerRow: 4,
  beatsPerBar: 4,
  mainWaveformPointsPerBar: 96,
  previewWaveformPoints: 640,
  holdToLoopMs: 220,
  tapHistorySize: 6,
  exportBitrateKbps: 192,
  allowedSelectionLengths: [1, 2, 4] as const,
  mainWaveformRowHeight: 74,
};

export type AllowedSelectionLength =
  (typeof configs.allowedSelectionLengths)[number];
