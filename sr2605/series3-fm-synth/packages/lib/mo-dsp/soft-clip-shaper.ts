import { m_sqrt2 } from "@my/lib/ax/math-utils";
import { clampValue } from "@my/lib/ax/number-utils";

export function applyHardClip(x: number, a?: number) {
  if (a) {
    return clampValue(x, -a, a);
  } else {
    return clampValue(x, -1, 1);
  }
}

export function applySoftClip(x: number) {
  const sqrt2 = m_sqrt2;
  x = clampValue(x, -sqrt2, sqrt2);
  return x - (x * x * x) / 6.0;
}

export function applySoftClipAt(_x: number, a: number) {
  return applySoftClip(_x / a) * a;
}
