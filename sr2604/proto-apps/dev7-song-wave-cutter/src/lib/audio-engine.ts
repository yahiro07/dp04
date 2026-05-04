import type { AudioClip } from "../types";
import {
  buildMonoData,
  copyChannelData,
  fileToArrayBuffer,
} from "./audio-utils";

const audioContext = new AudioContext();

let currentSource: AudioBufferSourceNode | null = null;
let currentGainNode: GainNode | null = null;
let onPlaybackEnded: (() => void) | null = null;

const stopPlayback = () => {
  if (currentSource) {
    currentSource.onended = null;
  }
  currentSource?.stop();
  currentSource?.disconnect();
  currentGainNode?.disconnect();
  currentSource = null;
  currentGainNode = null;
  onPlaybackEnded = null;
};

const resumeAudioContext = async () => {
  if (audioContext.state !== "running") {
    await audioContext.resume();
  }
};

const decodeAudioFile = async (file: File): Promise<AudioClip> => {
  const fileBuffer = await fileToArrayBuffer(file);
  const decodedBuffer = await audioContext.decodeAudioData(fileBuffer.slice(0));
  const channelData = copyChannelData(decodedBuffer);

  return {
    fileName: file.name,
    buffer: decodedBuffer,
    sampleRate: decodedBuffer.sampleRate,
    totalSamples: decodedBuffer.length,
    durationSeconds: decodedBuffer.duration,
    channelData,
    monoData: buildMonoData(decodedBuffer),
  };
};

const playSegment = async (
  audioClip: AudioClip,
  startSample: number,
  endSample: number,
  loop: boolean,
  handleEnded?: () => void,
) => {
  if (endSample <= startSample) {
    return;
  }

  await resumeAudioContext();
  stopPlayback();

  const startSeconds = startSample / audioClip.sampleRate;
  const endSeconds = endSample / audioClip.sampleRate;
  const durationSeconds = endSeconds - startSeconds;

  const sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = audioClip.buffer;
  sourceNode.loop = loop;
  if (loop) {
    sourceNode.loopStart = startSeconds;
    sourceNode.loopEnd = endSeconds;
  }

  const gainNode = audioContext.createGain();
  gainNode.gain.value = 1;

  sourceNode.connect(gainNode);
  gainNode.connect(audioContext.destination);

  currentSource = sourceNode;
  currentGainNode = gainNode;
  onPlaybackEnded = handleEnded ?? null;

  sourceNode.onended = () => {
    if (!loop) {
      onPlaybackEnded?.();
      stopPlayback();
    }
  };

  if (loop) {
    sourceNode.start(0, startSeconds);
  } else {
    sourceNode.start(0, startSeconds, durationSeconds);
  }
};

export const audioEngine = {
  decodeAudioFile,
  playSegment,
  stopPlayback,
  resumeAudioContext,
};
