import { ISynthesizerRoot } from "@/dsp/api";
import { dspEnvs } from "@/dsp/konsole";
import { createSynthesizerRoot } from "@/dsp/synthesizer-root";
import { WorkletInputMessage } from "@/machine/worklet-types";

dspEnvs.isDebug = import.meta.env.DEV;

function createProcessorClass() {
  return class extends AudioWorkletProcessor {
    private synthesizer: ISynthesizerRoot;
    private maxFrameLength = 0;
    constructor() {
      super();
      this.synthesizer = createSynthesizerRoot();

      // const replyMessage = (msg: WorkletOutputMessage) => {
      //   this.port.postMessage(msg);
      // };
      this.port.onmessage = (event: { data: WorkletInputMessage }) => {
        const { type } = event.data;
        if (type === "setParameter") {
          const { id, value } = event.data;
          this.synthesizer.setParameter(id, value);
        } else if (type === "noteOn") {
          const { noteNumber, velocity } = event.data;
          this.synthesizer.noteOn(noteNumber, velocity);
        } else if (type === "noteOff") {
          const { noteNumber } = event.data;
          this.synthesizer.noteOff(noteNumber);
        } else if (type === "applyCommand") {
          const { id, value } = event.data;
          this.synthesizer.applyCommand(id, value);
        } else if (type === "setOperatorParameter") {
          const { opIndex, paramKey, value } = event.data;
          this.synthesizer.setOperatorParameter(opIndex, paramKey, value);
        } else if (type === "setCommonParameter") {
          const { paramKey, value } = event.data;
          this.synthesizer.setCommonParameter(paramKey, value);
        } else if (type === "setModulationFlags") {
          const { flags } = event.data;
          this.synthesizer.setModulationFlags(flags);
        }
      };
    }
    process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
      const bufferL = outputs[0][0];
      const bufferR = outputs[0][1];
      // Since the buffer length is only known within `process()` in a Worklet, `prepareProcessing` is called here
      // In the C++ implementation, it is assumed that `prepareProcessing` is called in advance on a non-audio thread
      if (bufferL.length > this.maxFrameLength) {
        this.synthesizer.prepareProcessing(
          globalThis.sampleRate,
          bufferL.length,
        );
        this.maxFrameLength = bufferL.length;
      }
      if (bufferR) {
        bufferL.fill(0);
        bufferR.fill(0);
        this.synthesizer.processAudio(bufferL, bufferR, bufferL.length);
      } else {
        bufferL.fill(0);
        this.synthesizer.processAudio(bufferL, bufferL, bufferL.length);
      }
      return true;
    }
  };
}

registerProcessor("my-processor", createProcessorClass());
