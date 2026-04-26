export type VgmHeader = {
  version: string;
  samplesCount: number;
  dataOffset: number;
  ay8910Clock: number;
};

export type VgmCommand =
  | { type: "wait"; samples: number }
  | { type: "setRegister"; address: number; value: number };

export type VgmSong = {
  header: VgmHeader;
  sampleRate: number;
  commands: VgmCommand[];
};
