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
