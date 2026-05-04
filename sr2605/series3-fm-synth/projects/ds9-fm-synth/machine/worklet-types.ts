import { OperatorParameterKey } from "@ds9/base/parameters";

export type WorkletInputMessage =
  | { type: "setParameter"; id: number; value: number }
  | {
      type: "setOperatorParameter";
      opIndex: number;
      paramKey: OperatorParameterKey;
      value: number | boolean;
    }
  | { type: "setModulationFlags"; flags: number }
  | { type: "noteOn"; noteNumber: number; velocity: number }
  | { type: "noteOff"; noteNumber: number }
  | { type: "applyCommand"; id: number; value: number };

export type WorkletOutputMessage = { type: "dummy" };

export type WorkletWrapper = {
  resumeIfNeed(): Promise<void>;
  setParameter(id: number, value: number): void;
  noteOn(noteNumber: number, velocity: number): void;
  noteOff(noteNumber: number): void;
  applyCommand(id: number, value: number): void;
  sendMessage(msg: WorkletInputMessage): void;
  subscribeMessage(fn: (ev: WorkletOutputMessage) => void): void;
};
