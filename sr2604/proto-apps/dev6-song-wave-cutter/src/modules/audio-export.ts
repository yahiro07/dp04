import lamejs from "lamejs";
import { BAR_LENGTH_OPTIONS, barLengthLabel } from "../store";

// ── Helpers ───────────────────────────────────────────────────────────────────

function writeStr(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function floatToInt16(
  data: Float32Array,
  srcOffset: number,
  length: number,
): Int16Array {
  const out = new Int16Array(length);
  for (let i = 0; i < length; i++) {
    const s = Math.max(-1, Math.min(1, data[srcOffset + i]));
    out[i] = s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff);
  }
  return out;
}

/**
 * Build an export filename:
 *   <stem>_off<offsetBars>_dur<durationBars>.<ext>
 * where bars are expressed as numbers (e.g. 0.25, 1, 4).
 */
function buildFileName(
  srcName: string,
  offsetN: number,
  offsetBarLengthIdx: number,
  durationBarLengthIdx: number,
  ext: string,
): string {
  const stem = srcName.replace(/\.[^/.]+$/, "");
  const offBars = offsetN * BAR_LENGTH_OPTIONS[offsetBarLengthIdx];
  const durBars = BAR_LENGTH_OPTIONS[durationBarLengthIdx];
  // Use barLengthLabel only for known fractions; fall back to number string.
  const fmtBars = (v: number) => {
    if (Number.isInteger(v)) return String(v);
    return barLengthLabel(v) !== String(v)
      ? barLengthLabel(v).replace("/", "-")
      : String(v);
  };
  return `${stem}_off${fmtBars(offBars)}_dur${fmtBars(durBars)}.${ext}`;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── WAV export ────────────────────────────────────────────────────────────────

export function exportWav(
  buffer: AudioBuffer,
  startSample: number,
  durationSamples: number,
  fileName: string,
  offsetN: number,
  offsetBarLengthIdx: number,
  durationBarLengthIdx: number,
): void {
  const endSample = Math.min(startSample + durationSamples, buffer.length);
  const numSamples = endSample - startSample;
  if (numSamples <= 0) return;

  const numChannels = Math.min(buffer.numberOfChannels, 2);
  const sampleRate = buffer.sampleRate;
  const bytesPerSample = 2; // 16-bit PCM
  const dataLength = numSamples * numChannels * bytesPerSample;

  const ab = new ArrayBuffer(44 + dataLength);
  const view = new DataView(ab);

  // RIFF/WAVE header
  writeStr(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeStr(view, 8, "WAVE");
  writeStr(view, 12, "fmt ");
  view.setUint32(16, 16, true); // subchunk1Size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // byteRate
  view.setUint16(32, numChannels * bytesPerSample, true); // blockAlign
  view.setUint16(34, 16, true); // bitsPerSample
  writeStr(view, 36, "data");
  view.setUint32(40, dataLength, true);

  // Interleaved PCM samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const s = Math.max(
        -1,
        Math.min(1, buffer.getChannelData(ch)[startSample + i]),
      );
      view.setInt16(
        offset,
        s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff),
        true,
      );
      offset += 2;
    }
  }

  const blob = new Blob([ab], { type: "audio/wav" });
  downloadBlob(
    blob,
    buildFileName(
      fileName,
      offsetN,
      offsetBarLengthIdx,
      durationBarLengthIdx,
      "wav",
    ),
  );
}

// ── MP3 export ────────────────────────────────────────────────────────────────

export function exportMp3(
  buffer: AudioBuffer,
  startSample: number,
  durationSamples: number,
  fileName: string,
  offsetN: number,
  offsetBarLengthIdx: number,
  durationBarLengthIdx: number,
): void {
  const endSample = Math.min(startSample + durationSamples, buffer.length);
  const numSamples = endSample - startSample;
  if (numSamples <= 0) return;

  const numChannels = Math.min(buffer.numberOfChannels, 2) as 1 | 2;
  const sampleRate = buffer.sampleRate;

  const encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, 128);
  const blockSize = 1152; // MPEG frame size required by LAME
  const chunks: Uint8Array[] = [];

  for (let i = 0; i < numSamples; i += blockSize) {
    const len = Math.min(blockSize, numSamples - i);
    const left = floatToInt16(buffer.getChannelData(0), startSample + i, len);
    let mp3buf: Int8Array;
    if (numChannels === 2) {
      const right = floatToInt16(
        buffer.getChannelData(1),
        startSample + i,
        len,
      );
      mp3buf = encoder.encodeBuffer(left, right);
    } else {
      mp3buf = encoder.encodeBuffer(left);
    }
    if (mp3buf.length > 0) {
      chunks.push(new Uint8Array(mp3buf));
    }
  }

  const flushed = encoder.flush();
  if (flushed.length > 0) {
    chunks.push(new Uint8Array(flushed));
  }

  const blob = new Blob(chunks as BlobPart[], { type: "audio/mpeg" });
  downloadBlob(
    blob,
    buildFileName(
      fileName,
      offsetN,
      offsetBarLengthIdx,
      durationBarLengthIdx,
      "mp3",
    ),
  );
}
