import { OperatorWave } from "@ds9/base/parameters";

export function getWaveformSample(phase: number, wave: OperatorWave) {
  switch (wave) {
    case OperatorWave.Sine:
      return Math.sin(phase * 2 * Math.PI) * 2 - 1;
    case OperatorWave.Triangle:
      return 1 - (2 * Math.abs(phase - 0.5) * 2 - 1);
    case OperatorWave.Square:
      return phase < 0.5 ? 1 : -1;
    case OperatorWave.Saw:
      return phase * 2 - 1;
    case OperatorWave.Noise:
      return Math.random() * 2 - 1;
  }
}
