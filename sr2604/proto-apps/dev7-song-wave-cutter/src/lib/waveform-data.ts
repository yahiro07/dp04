import { configs } from "../configs";
import type { AudioClip, WaveformBar } from "../types";
import {
  clamp,
  getPreviewSampleCount,
  getSamplesPerBar,
  getSamplesPerBeat,
} from "./audio-utils";

export const buildPeakEnvelope = (
  samples: Float32Array,
  startSample: number,
  endSample: number,
  pointCount: number,
) => {
  const safeStart = clamp(Math.floor(startSample), 0, samples.length);
  const safeEnd = clamp(Math.ceil(endSample), safeStart, samples.length);

  if (safeEnd <= safeStart) {
    return Array.from({ length: pointCount }, () => 0);
  }

  const totalWindowSize = safeEnd - safeStart;
  const pointSize = totalWindowSize / pointCount;

  return Array.from({ length: pointCount }, (_, pointIndex) => {
    const pointStart = Math.floor(safeStart + pointIndex * pointSize);
    const pointEnd = Math.min(
      safeEnd,
      Math.floor(safeStart + (pointIndex + 1) * pointSize),
    );
    let peak = 0;

    for (
      let sampleIndex = pointStart;
      sampleIndex < pointEnd;
      sampleIndex += 1
    ) {
      const sampleValue = Math.abs(samples[sampleIndex] ?? 0);
      if (sampleValue > peak) {
        peak = sampleValue;
      }
    }

    return peak;
  });
};

export const buildPreviewEnvelope = (audioClip: AudioClip) => {
  return buildPeakEnvelope(
    audioClip.monoData,
    0,
    getPreviewSampleCount(audioClip.sampleRate),
    configs.previewWaveformPoints,
  );
};

export const buildPreviewBeatLineRatios = (
  audioClip: AudioClip,
  bpm: number,
  draftOffsetSamples: number,
) => {
  const previewSampleCount = getPreviewSampleCount(audioClip.sampleRate);
  const samplesPerBeat = getSamplesPerBeat(audioClip.sampleRate, bpm);
  const beatLineRatios: number[] = [];

  for (
    let samplePosition = draftOffsetSamples;
    samplePosition <= previewSampleCount;
    samplePosition += samplesPerBeat
  ) {
    beatLineRatios.push(samplePosition / previewSampleCount);
  }

  return beatLineRatios;
};

export const buildWaveformBars = (
  audioClip: AudioClip,
  appliedOffsetSamples: number,
  appliedBpm: number,
) => {
  const samplesPerBar = getSamplesPerBar(audioClip.sampleRate, appliedBpm);

  return Array.from(
    { length: configs.displayMaxBars },
    (_, barIndex): WaveformBar => {
      const startSample = Math.round(
        appliedOffsetSamples + samplesPerBar * barIndex,
      );
      const endSample = Math.round(startSample + samplesPerBar);

      return {
        barIndex,
        envelope: buildPeakEnvelope(
          audioClip.monoData,
          startSample,
          endSample,
          configs.mainWaveformPointsPerBar,
        ),
        hasAudio: startSample < audioClip.totalSamples,
      };
    },
  );
};
