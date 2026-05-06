import { debugEmitError } from "@my/lib/ax/konsole";

export type Interpolator = {
  feed(nextValue: number, n: number, reset?: boolean): void;
  advance(): number;
  reset(): void;
};

export function createInterpolator(): Interpolator {
  let value: number | undefined;
  let delta = 0;

  return {
    feed(nextValue, n, reset) {
      if (value === undefined || reset) {
        value = nextValue;
      }
      delta = (nextValue - value) / n;
    },
    advance() {
      if (value === undefined) {
        debugEmitError("interpolator.advance: value is undefined");
        return 0;
      }
      const res = value;
      value += delta;
      return res;
    },
    reset() {
      value = undefined;
    },
  };
}
