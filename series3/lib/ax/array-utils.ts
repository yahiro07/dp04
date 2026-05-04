export function seqNumbers(n: number): number[] {
  return new Array(n).fill(0).map((_, i) => i);
}

export function replaceArrayItem<T>(items: T[], index: number, value: T): T[] {
  return items.map((it, i) => (i === index ? value : it));
}
