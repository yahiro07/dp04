import { applyHardClip, applySoftClip } from "@my/lib/mo-dsp/soft-clip-shaper";

export type FrameProcessorFunction = (buffer: Float32Array) => void;

type ScriptProcessorSoundEngine = {
  sampleRate: number;
  addProcessorFn(fn: FrameProcessorFunction): void;
  startOnUserAction(): Promise<void>;
};

export function createScriptProcessorSoundEngine(options?: {
  withSoftClip?: boolean;
}): ScriptProcessorSoundEngine {
  const audioContext = new AudioContext({ latencyHint: "interactive" });
  const bufferSize = 1024;
  const local = {
    processor: undefined as ScriptProcessorNode | undefined,
    frameProcessorFunction: undefined as FrameProcessorFunction | undefined,
    audioFrameBuffer: new Float32Array(bufferSize),
  };

  function setupProcessor() {
    const processor = audioContext.createScriptProcessor(bufferSize, 2, 2);
    processor.onaudioprocess = (event) => {
      const outputLs = event.outputBuffer.getChannelData(0);
      const outputRs = event.outputBuffer.getChannelData(1);
      const { frameProcessorFunction, audioFrameBuffer } = local;
      audioFrameBuffer.fill(0);
      frameProcessorFunction?.(audioFrameBuffer);

      for (let i = 0; i < bufferSize; i++) {
        let sample = audioFrameBuffer[i];
        if (options?.withSoftClip) {
          sample = applySoftClip(sample);
        } else {
          sample = applyHardClip(sample);
        }
        outputLs[i] = sample;
        outputRs[i] = sample;
      }
    };
    processor.connect(audioContext.destination);
    return processor;
  }

  return {
    get sampleRate() {
      return audioContext.sampleRate;
    },
    addProcessorFn(fn) {
      local.frameProcessorFunction = fn;
    },
    async startOnUserAction() {
      if (!local.processor) {
        local.processor = setupProcessor();
      }
      const st = audioContext.state;
      if (st !== "running" && st !== "closed") {
        try {
          await audioContext.resume();
        } catch (_) {}
      }
    },
  };
}
