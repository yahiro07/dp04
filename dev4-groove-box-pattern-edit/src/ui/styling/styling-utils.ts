export function npx(value: number, fracDigits?: number) {
  if (fracDigits && Number.isFinite(fracDigits)) {
    return `${value.toFixed(fracDigits)}px`;
  } else {
    return `${value}px`;
  }
}

export function flexHorizontal(gap?: number) {
  return {
    display: "flex",
    ...(gap && { gap: npx(gap) }),
  } as const;
}

export function flexAligned(gap?: number) {
  return {
    display: "flex",
    alignItems: "center",
    ...(gap && { gap: npx(gap) }),
  } as const;
}

export function flexVertical(gap?: number) {
  return {
    display: "flex",
    flexDirection: "column",
    ...(gap && { gap: npx(gap) }),
  } as const;
}
