export function setupHandleClickOutside(
  element: HTMLElement,
  onOutside: (e: PointerEvent) => void,
) {
  const handlePointer = (e: PointerEvent) => {
    const target = e.target;
    if (!(target instanceof Node)) return;
    if (element.contains(target)) return;
    onOutside(e);
  };

  document.addEventListener("click", handlePointer, { capture: true });

  return () => {
    document.removeEventListener("click", handlePointer, { capture: true });
  };
}
