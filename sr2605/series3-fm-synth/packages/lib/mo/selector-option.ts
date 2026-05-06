export type SelectorOption<T extends string | number> = {
  label: string;
  value: T;
};

export function createEnumOptions<T extends number>(
  source: [T, string][],
): SelectorOption<T>[] {
  return source.map(([value, label]) => ({ label, value }));
}

export function createPlainSelectorOptions<T extends string>(
  values: T[],
): SelectorOption<T>[] {
  return values.map((v) => ({ label: v, value: v }));
}
