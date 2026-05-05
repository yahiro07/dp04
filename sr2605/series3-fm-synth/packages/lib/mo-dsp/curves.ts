import { m_abs, m_cos, m_pi, m_sin } from "@my/lib/ax/math-utils";

export const curveMapper = {
  riseSine(x: number) {
    return m_sin(x * m_pi * 0.5);
  },
  fallSine(x: number) {
    return 1 - m_sin(x * m_pi * 0.5);
  },
  riseInvCosine(x: number) {
    return 0.5 - 0.5 * m_cos(x * m_pi);
  },
};

export function mapExpCurve(x: number, scaler: number = 4) {
  return (2 ** (x * scaler) - 1) / (2 ** scaler - 1);
}

export function mapInvExpCurve(x: number, scaler: number = 4) {
  return 1 - mapExpCurve(1 - x, scaler);
}

//x:-1__1, k:-1__1, positive k for low curve, negative k for high curve
export function tunableSigmoid(x: number, k: number) {
  return (x - k * x) / (k - 2 * k * m_abs(x) + 1);
}
