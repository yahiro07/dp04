import { m_pow } from "@my/lib/ax/math-utils";

export function midiToFrequency(midiNote: number): number {
  return 440 * m_pow(2, (midiNote - 69) / 12);
}
