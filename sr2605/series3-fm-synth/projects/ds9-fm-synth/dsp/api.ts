import { CommonParameterKey, OperatorParameterKey } from "@ds9/base/parameters";

export interface ISynthesizerRoot {
  prepareProcessing(sampleRate: number, maxFrames: number): void;
  setParameter(id: number, value: number): void;
  setOperatorParameter(
    operatorIndex: number,
    paramKey: OperatorParameterKey,
    value: number | boolean,
  ): void;
  setCommonParameter(
    paramKey: CommonParameterKey,
    value: number | boolean,
  ): void;
  setModulationFlags(flags: number): void;
  noteOn(noteNumber: number, velocity: number): void;
  noteOff(noteNumber: number): void;
  processAudio(
    bufferL: Float32Array,
    bufferR: Float32Array,
    frames: number,
  ): void;
  applyCommand(id: number, value: number): void;
}
