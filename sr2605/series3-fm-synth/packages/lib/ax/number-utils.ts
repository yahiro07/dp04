import { m_floor, m_max, m_min, m_random } from "./math-utils";

export function clampValue(value: number, lo: number, hi: number) {
  if (value < lo) return lo;
  if (value > hi) return hi;
  return value;
}

export function lowClip(value: number, lo: number) {
  return m_max(value, lo);
}

export function highClip(value: number, hi: number) {
  return m_min(value, hi);
}

export function mapUnaryTo(value: number, d0: number, d1: number) {
  return d0 + (d1 - d0) * value;
}

export function mapUnaryFrom(
  val: number,
  lo: number,
  hi: number,
  clamp?: boolean,
) {
  if (hi === lo) return lo;
  const v = (val - lo) / (hi - lo);
  if (clamp) {
    return clampValue(v, 0, 1);
  }
  return v;
}

export function linearInterpolate(
  value: number,
  s0: number,
  s1: number,
  d0: number,
  d1: number,
  clamp?: boolean,
) {
  if (s1 === s0) return d0;
  const v = ((value - s0) / (s1 - s0)) * (d1 - d0) + d0;
  if (clamp) {
    const lo = m_min(d0, d1);
    const hi = m_max(d0, d1);
    return clampValue(v, lo, hi);
  }
  return v;
}

export function mixValue(a: number, b: number, m: number) {
  return (1 - m) * a + m * b;
}

export function power2(value: number) {
  return value * value;
}

export function invPower2(value: number) {
  return 1 - (1 - value) * (1 - value);
}

export function power3(value: number) {
  return value * value * value;
}

export function fracPart(value: number) {
  return value - m_floor(value);
}

export function randomBipolar() {
  return m_random() * 2 - 1;
}
