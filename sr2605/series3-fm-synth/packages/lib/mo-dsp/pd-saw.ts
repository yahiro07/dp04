export function getOscWaveformPdSaw(
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
