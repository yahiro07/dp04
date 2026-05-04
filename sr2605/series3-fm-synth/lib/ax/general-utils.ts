export function iife<T>(fn: () => T) {
  return fn();
}

export function assignTyped<T extends object>(obj: T, attrs: Partial<T>) {
  Object.assign(obj, attrs);
}
