import { debugEmitError } from "@dsp/base/konsole";

export type Interpolator = {
  feed(nextValue: number, n: number): void;
  advance(): number;
  reset(): void;
};

export function createInterpolator() {
  let value: number | undefined;
  let delta = 0;

  return {
    feed(nextValue: number, n: number) {
      if (value === undefined) {
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
