import { createDelayLineRingBuffer } from "@ds9/dsp/delay-line-ring-buffer";
import { clampValue, mixValue, power2 } from "@lib/ax/number-utils";

type DelayEffect = {
  prepare(sampleRate: number): void;
  reset(): void;
  processSamples(
    buffer: Float32Array,
    len: number,
    prTime: number,
    prFeed: number,
    prMix: number,
  ): void;
};

export function createDelayEffect(): DelayEffect {
  const delayMaxTimeSec = 2;
  const state = {
    sampleRate: 0,
    delayLine: createDelayLineRingBuffer(),
  };

  return {
    prepare(sampleRate) {
      state.sampleRate = sampleRate;
      const delayLineLength = sampleRate * delayMaxTimeSec;
      state.delayLine.ensureSize(delayLineLength);
    },
    reset() {
      state.delayLine.clear();
    },
    processSamples(buffer, len, prTime, prFeed, prMix) {
      if (state.sampleRate === 0) return;
      const delayLineLength = state.delayLine.size();
      const maxNumSamples = delayMaxTimeSec * state.sampleRate;
      let delayPos = power2(prTime) * maxNumSamples;
      delayPos = clampValue(delayPos, 1, delayLineLength - 1);
      for (let i = 0; i < len; i++) {
        const input = buffer[i];
        const dry = input;
        const yd = state.delayLine.take(delayPos);
        const wet = input + yd * prFeed * 0.95;
        const y = mixValue(dry, wet, prMix);
        buffer[i] = y;
        state.delayLine.push(wet);
      }
    },
  };
}
