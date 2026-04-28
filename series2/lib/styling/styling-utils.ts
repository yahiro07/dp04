export function npx(value: number, fracDigits?: number) {
  if (fracDigits && Number.isFinite(fracDigits)) {
    return `${value.toFixed(fracDigits)}px`;
  } else {
    return `${value}px`;
  }
}
