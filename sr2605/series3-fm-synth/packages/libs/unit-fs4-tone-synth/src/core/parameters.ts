import { createEnumOptions } from "@my/lib/mo/selector-option";

export enum OscWave {
  Saw = 0,
  Rect,
  Tri,
  Sine,
}
export const oscWaveOptions = createEnumOptions([
  [OscWave.Saw, "saw"],
  [OscWave.Rect, "rect"],
  [OscWave.Tri, "tri"],
  [OscWave.Sine, "sine"],
]);

export type UnitParameters = {
  oscWave: OscWave;
  oscPitch: number;
};

export function createDefaultParameters(): UnitParameters {
  return {
    oscWave: OscWave.Saw,
    oscPitch: 0.5,
  };
}
