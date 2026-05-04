export const curveMapper = {
  riseSine(x: number) {
    return Math.sin(x * Math.PI * 0.5);
  },
  fallSine(x: number) {
    return 1 - Math.sin(x * Math.PI * 0.5);
  },
  riseInvCosine(x: number) {
    return 0.5 - 0.5 * Math.cos(x * Math.PI);
  },
};

export function mapExpCurve(x: number, scaler: number = 4) {
  return (2 ** (x * scaler) - 1) / (2 ** scaler - 1);
}

export function mapInvExpCurve(x: number, scaler: number = 4) {
  return 1 - mapExpCurve(1 - x, scaler);
}
