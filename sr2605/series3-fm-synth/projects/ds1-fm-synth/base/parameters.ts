import { createEnumOptions } from "@lib/mo/selector-option";

export enum OperatorWave {
  Sine = 0,
  Noise,
  Saw,
  Square,
  Triangle,
  SineCSF,
  PdSaw,
}
export const operatorWaveformOptions = createEnumOptions([
  [OperatorWave.Sine, "SINE"],
  [OperatorWave.Noise, "NOISE"],
  [OperatorWave.Saw, "SAW"],
  [OperatorWave.Square, "RECT"],
  [OperatorWave.Triangle, "TRI"],
  [OperatorWave.SineCSF, "SINE_CSF"],
  [OperatorWave.PdSaw, "PD_SAW"],
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
  shape: number;
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
    shape: 0,
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
