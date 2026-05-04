import { createEnumOptions } from "@lib/mo/selector-option";

export enum OperatorWave {
  Sine = 0,
  Triangle = 1,
  Square = 2,
  Saw = 3,
  Noise = 4,
}
export const operatorWaveformOptions = createEnumOptions([
  [OperatorWave.Sine, "SINE"],
  [OperatorWave.Triangle, "TRI"],
  [OperatorWave.Square, "RECT"],
  [OperatorWave.Saw, "SAW"],
  [OperatorWave.Noise, "NOISE"],
]);

export type OperatorParameters = {
  wave: OperatorWave;
  octave: number;
  semi: number;
  fine: number;
  ratio: number;
  level: number;
  active: boolean;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  feedback: number;
  unisonOn: boolean;
  unisonNum: number;
  unisonDetune: number;
  unisonMix: number;
  unisonRndPhase: boolean;
};
export type OperatorParameterKey = keyof OperatorParameters;

export function createOperatorParameters(): OperatorParameters {
  return {
    wave: OperatorWave.Sine,
    octave: 0,
    semi: 0,
    fine: 0,
    ratio: 1,
    level: 1,
    active: true,
    attack: 0,
    decay: 0,
    sustain: 1,
    release: 0,
    feedback: 0,
    unisonOn: false,
    unisonNum: 7,
    unisonDetune: 0.5,
    unisonMix: 0.5,
    unisonRndPhase: true,
  };
}

export type CommonParameters = {
  delayEnabled: boolean;
  delayTime: number;
  delayFeed: number;
  delayMix: number;
  reverbEnabled: boolean;
  reverbTime: number;
  reverbMix: number;
};

export type CommonParameterKey = keyof CommonParameters;

export function createCommonParameters(): CommonParameters {
  return {
    delayEnabled: false,
    delayTime: 0.5,
    delayFeed: 0.5,
    delayMix: 0.5,
    reverbEnabled: false,
    reverbTime: 0.5,
    reverbMix: 0.5,
  };
}
