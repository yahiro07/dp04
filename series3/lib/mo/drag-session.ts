type Point = {
  x: number;
  y: number;
};
type DragHandlerEvent = {
  position: Point;
  originalPosition: Point;
};

export function startDragSession(
  e0: PointerEvent,
  callbacks: {
    onDown?(e: DragHandlerEvent): void;
    onMove?(e: DragHandlerEvent): void;
    onUp?(e: DragHandlerEvent): void;
    onCancel?(e: DragHandlerEvent): void;
  },
) {
  const el = e0.currentTarget as HTMLDivElement;
  const rect = el.getBoundingClientRect();

  const getPointerPosition = (e: PointerEvent) => {
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const originalPosition = getPointerPosition(e0);

  const onDown = (e: PointerEvent) => {
    const position = getPointerPosition(e);
    callbacks.onDown?.({
      position,
      originalPosition,
    });
  };
  const onMove = (e: PointerEvent) => {
    const position = getPointerPosition(e);
    callbacks.onMove?.({
      position,
      originalPosition,
    });
  };
  const cleanup = () => {
    try {
      el.releasePointerCapture(e0.pointerId);
    } catch {
      // ignore
    }
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerCancel);
  };
  const onPointerUp = (e: PointerEvent) => {
    if (e.pointerId !== e0.pointerId) {
      return;
    }
    callbacks.onUp?.({
      position: getPointerPosition(e),
      originalPosition,
    });
    cleanup();
  };
  const onPointerCancel = (e: PointerEvent) => {
    if (e.pointerId !== e0.pointerId) {
      return;
    }
    callbacks.onCancel?.({
      position: getPointerPosition(e),
      originalPosition,
    });
    cleanup();
  };

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerCancel);
  try {
    el.setPointerCapture(e0.pointerId);
  } catch {
    // ignore
  }
  onDown(e0);
}
