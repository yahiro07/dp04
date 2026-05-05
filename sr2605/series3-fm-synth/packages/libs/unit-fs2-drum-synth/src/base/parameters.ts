import { SelectorOption } from "@my/lib/mo/selector-option";

export enum KickEgWave {
  ds,
  d,
  hd,
}

export const KickEgWaveOptions: SelectorOption<KickEgWave>[] = [
  { label: "DS", value: KickEgWave.ds },
  { label: "D", value: KickEgWave.d },
  { label: "HD", value: KickEgWave.hd },
];

export type UnitParameters = {
  oscWaveNoise: boolean;
  oscShape: number;
  oscPitch: number;
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
    oscWaveNoise: false,
    oscShape: 0.3,
    oscPitch: 0.44,
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
