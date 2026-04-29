export type Position2D = {
  x: number;
  y: number;
};

export type PatternUnit_Seri8 = {
  id: string;
  variant: "seri8";
  position: Position2D;
  active: boolean;
  channel: number; //auto assignment
  instrumentId: string; //gm-0 for grand piano, gm-4 for electric piano, etc.
  relativeNotes: number[]; // 1/8 x 8notes, 1bar pattern
};

export type PatternUnit_Seri8Static = {
  id: string;
  variant: "seri8-static";
  position: Position2D;
  active: boolean;
  channel: number; //auto assignment
  instrumentId: string; //gm-0 for grand piano, gm-4 for electric piano, etc.
  stepNotes: number[]; // 1/8 x 8notes, 1bar pattern
};

export type PatternUnit_Seri8Drum = {
  id: string;
  variant: "seri8-drum";
  position: Position2D;
  active: boolean;
  stepNotes: number[]; // 1/8 x 8notes, 1bar pattern
};
export type StaticUnit_RootNotesV1 = {
  id: string;
  variant: "rootNotes-v1";
  active: boolean;
  relativeRootNotes: number[]; //1bar x4, relative from key
};

export type StaticUnit_PrimaryTone = {
  id: string;
  variant: "primary-tone";
  channel: number; //auto assignment
  instrumentId: string;
  // relativeNotes: number[]; //1bar x4, relative from key
};

export type DynamicUnit =
  | PatternUnit_Seri8
  | PatternUnit_Seri8Static
  | PatternUnit_Seri8Drum;

export type Scene = {
  bpm: number;
  key: string;
  units: DynamicUnit[];
  primaryToneUnit: StaticUnit_PrimaryTone;
  rootNoteUnit: StaticUnit_RootNotesV1;
};

export type SceneEditCommand =
  | { type: "setKey"; key: string }
  | { type: "addUnit"; unit: DynamicUnit }
  | { type: "removeUnit"; unitId: string }
  | { type: "setUnitActive"; unitId: string; active: boolean }
  | { type: "setUnitInstrumentId"; unitId: string; instrumentId: string }
  | {
      type: "setUnitStepNote";
      unitId: string;
      index: number;
      noteValue: number;
    };

export type MachineControlCommand =
  | { type: "setPlayState"; playing: boolean }
  | { type: "setBpm"; bpm: number }
  | { type: "playPrimaryTone"; noteNumber: number; velocity: number };

export type RootMachineCommand = SceneEditCommand | MachineControlCommand;

export type RootMachine = {
  initialize(): Promise<void>;
  resumeIfNeed(): Promise<void>;
  getSceneState(): Scene;
  handleCommand(command: RootMachineCommand): void;
};

export type UiAction = RootMachineCommand;
