import { konsoleEnvs } from "@my/lib/ax/konsole";
import {
  createKickSynthesizerDsp,
  KickSynthesizerDsp,
} from "../dsp/kick-synthesizer-dsp";
import { WorkletInputMessage } from "./worklet-types";

konsoleEnvs.isDebug = import.meta.env.DEV;

function createProcessorClass() {
  return class extends AudioWorkletProcessor {
    private dsp: KickSynthesizerDsp;
    private maxFrameLength = 0;
    constructor() {
      super();
      this.dsp = createKickSynthesizerDsp();

      // const replyMessage = (msg: WorkletOutputMessage) => {
      //   this.port.postMessage(msg);
      // };
      this.port.onmessage = (event: { data: WorkletInputMessage }) => {
        const { data } = event;
        const { type } = data;
        if (type === "setParameter") {
          this.dsp.setParameter(data.paramKey, data.value);
        } else if (type === "playTone") {
          this.dsp.playTone();
        } else if (type === "stopTone") {
          this.dsp.stopTone();
        } else if (type === "applyCommand") {
        }
      };
    }
    process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
      const bufferL = outputs[0][0];
      const bufferR = outputs[0][1];
      // Since the buffer length is only known within `process()` in a Worklet, `prepareProcessing` is called here
      // In the C++ implementation, it is assumed that `prepareProcessing` is called in advance on a non-audio thread
      if (bufferL.length > this.maxFrameLength) {
        this.dsp.prepare(globalThis.sampleRate, bufferL.length);
        this.maxFrameLength = bufferL.length;
      }
      if (bufferR) {
        bufferL.fill(0);
        bufferR.fill(0);
        this.dsp.processSamples(bufferL, bufferR, bufferL.length);
      } else {
        bufferL.fill(0);
        this.dsp.processSamples(bufferL, bufferL, bufferL.length);
      }
      return true;
    }
  };
}

registerProcessor("my-processor", createProcessorClass());
