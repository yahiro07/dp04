import {
  CommonParameterKey,
  CommonParameters,
  OperatorParameterKey,
  OperatorParameters,
} from "@/base/parameters";

export enum ModulationFlagBitPosition {
  mod01 = 0,
  mod12 = 1,
  mod23 = 2,
  mod02 = 3,
  mod13 = 4,
  mod03 = 5,
}

export type Scene = {
  operatorParameters: OperatorParameters[];
  commonParameters: CommonParameters;
  modulationFlags: number;
};

export type SceneEditCommand =
  | {
      type: "setOperatorParameter";
      opIndex: number;
      paramKey: OperatorParameterKey;
      value: number | boolean;
    }
  | {
      type: "setCommonParameter";
      paramKey: CommonParameterKey;
      value: number | boolean;
    }
  | { type: "setModulationFlags"; flags: number };

export type MachineControlCommand =
  // | { type: "setPlayState"; playing: boolean }
  // | { type: "setBpm"; bpm: number }
  | { type: "noteOn"; noteNumber: number; velocity: number }
  | { type: "noteOff"; noteNumber: number };

export type RootMachineCommand = SceneEditCommand | MachineControlCommand;

//used only in UI
export type OperatorScheme = "C" | "M" | "J" | "J2";
