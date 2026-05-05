import { readBufferInterpolated } from "@/dsp/buffer-functions";

export interface DelayLineRingBuffer {
  size(): number;
  ensureSize(length: number): void;
  clear(): void;
  push(x: number): void;
  take(i: number): number; // i: past sample index
}

export function createDelayLineRingBuffer(): DelayLineRingBuffer {
  let buffer = new Float32Array(1);
  let bufferLength = 1;

  let wi = 0;
  return {
    size() {
      return bufferLength;
    },
    ensureSize(length: number) {
      length >>>= 0;
      if (length !== buffer.length) {
        buffer = new Float32Array(length);
        bufferLength = length;
      }
    },
    clear() {
      buffer.fill(0);
    },
    push(x) {
      buffer[wi++] = x;
      if (wi >= bufferLength) {
        wi = 0;
      }
    },
    take(i) {
      if (i < 0 || i >= bufferLength) {
        // invalid
        return 0;
      }
      const fIndex = (wi - 1 - i + bufferLength) % bufferLength;
      return readBufferInterpolated(buffer, bufferLength, fIndex);
    },
  };
}
