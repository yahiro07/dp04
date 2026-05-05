import { OperatorWave } from "@ds9/base/parameters";

function getOscWaveformPdSaw(
  _phase: number,
  pdLevel: number,
  narrow = false,
): number {
  const sr = 0.5;
  const bp = sr * (1 - pdLevel * 0.95);
  const phaseShift = bp / 2;
  let phase = _phase + phaseShift;
  phase -= Math.floor(phase);
  let pp = 0;
  if (phase < bp) {
    const t = phase / bp;
    pp = t * sr;
  } else {
    const t = (phase - bp) / (1 - bp);
    pp = sr + t * (1 - sr);
  }
  if (narrow) {
    return Math.sin(pp * Math.PI * 2);
  } else {
    return -Math.cos(pp * Math.PI * 2);
  }
}

export function getWaveformSample(
  phase: number,
  wave: OperatorWave,
  prShape: number,
): number {
  if (wave === OperatorWave.Sine || wave === OperatorWave.SineCSF) {
    return Math.sin(phase * 2 * Math.PI);
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
    return getOscWaveformPdSaw(phase, prShape, false);
  } else {
    return 0;
  }
}
