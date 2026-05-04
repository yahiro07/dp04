import { configs } from "../configs";
import type { AudioClip } from "../types";
import { clamp } from "./audio-utils";

const floatToInt16 = (channelData: Float32Array) => {
  const int16Buffer = new Int16Array(channelData.length);

  for (let index = 0; index < channelData.length; index += 1) {
    const sample = clamp(channelData[index] ?? 0, -1, 1);
    int16Buffer[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  return int16Buffer;
};

const buildFileName = (fileName: string, startBar: number, length: number) => {
  const extensionIndex = fileName.lastIndexOf(".");
  const baseName =
    extensionIndex > 0 ? fileName.slice(0, extensionIndex) : fileName;
  return `${baseName}-bar-${startBar + 1}-len-${length}.mp3`;
};

export const exportMp3Segment = async (
  audioClip: AudioClip,
  startSample: number,
  endSample: number,
  selectionStartBar: number,
  selectionLength: number,
) => {
  const safeStart = clamp(startSample, 0, audioClip.totalSamples);
  const safeEnd = clamp(endSample, safeStart, audioClip.totalSamples);
  if (safeEnd <= safeStart) {
    return;
  }

  const channelCount = Math.min(audioClip.channelData.length, 2);
  const { Mp3Encoder } = await import("./lamejs-bundle");
  const encoder = new Mp3Encoder(
    channelCount,
    audioClip.sampleRate,
    configs.exportBitrateKbps,
  );
  const frameSize = 1152;
  const encodedChunks: Int8Array[] = [];
  const leftChannel = floatToInt16(
    audioClip.channelData[0].slice(safeStart, safeEnd),
  );
  const rightChannel =
    channelCount > 1
      ? floatToInt16(audioClip.channelData[1].slice(safeStart, safeEnd))
      : undefined;

  for (let offset = 0; offset < leftChannel.length; offset += frameSize) {
    const leftChunk = leftChannel.subarray(offset, offset + frameSize);
    const rightChunk = rightChannel?.subarray(offset, offset + frameSize);
    const encodedChunk = encoder.encodeBuffer(leftChunk, rightChunk);
    if (encodedChunk.length > 0) {
      encodedChunks.push(encodedChunk);
    }
  }

  const flushChunk = encoder.flush();
  if (flushChunk.length > 0) {
    encodedChunks.push(flushChunk);
  }

  const mp3Blob = new Blob(
    encodedChunks.map((chunk) => new Uint8Array(chunk)),
    {
      type: "audio/mpeg",
    },
  );
  const downloadUrl = URL.createObjectURL(mp3Blob);
  const linkElement = document.createElement("a");

  linkElement.href = downloadUrl;
  linkElement.download = buildFileName(
    audioClip.fileName,
    selectionStartBar,
    selectionLength,
  );
  linkElement.click();

  URL.revokeObjectURL(downloadUrl);
};
