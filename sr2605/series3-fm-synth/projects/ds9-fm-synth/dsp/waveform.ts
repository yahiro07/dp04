import { OperatorWave } from "@ds9/base/parameters";

export function getWaveformSample(
  phase: number,
  wave: OperatorWave,
  prShape: number,
): number {
  if (wave === OperatorWave.Sine || wave === OperatorWave.SineCSF) {
    return Math.sin(phase * 2 * Math.PI) * 2 - 1;
  } else if (wave === OperatorWave.Noise) {
    return Math.random() * 2 - 1;
  } else if (wave === OperatorWave.Saw) {
    return phase * 2 - 1;
  } else if (wave === OperatorWave.Square) {
    const pivot = 0.5 - prShape * 0.45;
    return phase < pivot ? 1 : -1;
  } else if (wave === OperatorWave.Triangle) {
    return 1 - (2 * Math.abs(phase - 0.5) * 2 - 1);
  } else if (wave === OperatorWave.PdSaw) {
    return phase * 2 - 1;
  } else {
    return 0;
  }
}
