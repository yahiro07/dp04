export function clampValue(value: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, value));
}

export function lowClip(value: number, lo: number) {
  return Math.max(value, lo);
}

export function highClip(value: number, hi: number) {
  return Math.min(value, hi);
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

export function linerInterpolate(
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
    const lo = Math.min(d0, d1);
    const hi = Math.max(d0, d1);
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
