import { configs } from "../configs";
import type { AudioClip, SelectionRange } from "../types";

export const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

export const clampBpm = (value: number) => {
  return clamp(Math.round(value), configs.bpmMin, configs.bpmMax);
};

export const getPreviewSampleCount = (sampleRate: number) => {
  return Math.round(sampleRate * configs.previewSeconds);
};

export const getSamplesPerBeat = (sampleRate: number, bpm: number) => {
  return (sampleRate * 60) / bpm;
};

export const getSamplesPerBar = (sampleRate: number, bpm: number) => {
  return getSamplesPerBeat(sampleRate, bpm) * configs.beatsPerBar;
};

export const getMaxDraftOffsetSamples = (audioClip: AudioClip) => {
  return Math.min(
    audioClip.totalSamples,
    getPreviewSampleCount(audioClip.sampleRate),
  );
};

export const getSelectionSampleWindow = (
  audioClip: AudioClip,
  appliedOffsetSamples: number,
  appliedBpm: number,
  selection: SelectionRange,
) => {
  const samplesPerBar = getSamplesPerBar(audioClip.sampleRate, appliedBpm);
  const startSample = Math.round(
    appliedOffsetSamples + samplesPerBar * selection.startBar,
  );
  const endSample = Math.round(startSample + samplesPerBar * selection.length);

  return {
    startSample: clamp(startSample, 0, audioClip.totalSamples),
    endSample: clamp(endSample, 0, audioClip.totalSamples),
  };
};

export const fileToArrayBuffer = async (file: File) => {
  return await file.arrayBuffer();
};

export const buildMonoData = (buffer: AudioBuffer) => {
  const channelCount = buffer.numberOfChannels;
  const totalSamples = buffer.length;
  const monoData = new Float32Array(totalSamples);

  for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
    const channelData = buffer.getChannelData(channelIndex);
    for (let sampleIndex = 0; sampleIndex < totalSamples; sampleIndex += 1) {
      monoData[sampleIndex] += channelData[sampleIndex] / channelCount;
    }
  }

  return monoData;
};

export const copyChannelData = (buffer: AudioBuffer) => {
  return Array.from({ length: buffer.numberOfChannels }, (_, channelIndex) => {
    const channelData = buffer.getChannelData(channelIndex);
    return new Float32Array(channelData);
  });
};
