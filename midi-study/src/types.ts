export type CommandItem = {
  trackIndex: number;
  tick: number;
  bytes: number[];
  comment?: string;
};

export type SmfSongMeta = {
  format: number;
  trackCount: number;
  timeDivision: number;
};

export type SmfSong = {
  commands: CommandItem[];
  meta: SmfSongMeta;
};

export type FlowNode = {
  trackIndex: number;
  stepPosition: number; // 1/16th note based
} & (
  | {
      type: "note";
      channel: number;
      noteNumber: number;
      velocity: number;
      stepDuration: number;
    }
  | { type: "command"; bytes: number[] }
);
