export enum KickEgWave {
  ds,
  d,
  pd,
}

export type UnitParameters = {
  oscPitch: number;
  oscShape: number;
  pitchEgWave: KickEgWave;
  pitchEgTime: number;
  pitchEgShape: number;
  pitchEgAmount: number;
  ampEgWave: KickEgWave;
  ampEgTime: number;
  ampEgShape: number;
  ampDrive: number;
  volume: number;
};

export type KickParameterKey = keyof UnitParameters;

export type KickParametersSuit = UnitParameters;

export function createDefaultUnitParameters(): UnitParameters {
  return {
    oscPitch: 0.44,
    oscShape: 0.3,
    pitchEgWave: KickEgWave.ds,
    pitchEgTime: 0.3,
    pitchEgShape: 0,
    pitchEgAmount: 0.53,
    ampEgWave: KickEgWave.d,
    ampEgTime: 0.63,
    ampEgShape: 0.6,
    ampDrive: 0.05,
    volume: 0.66,
  };
}
