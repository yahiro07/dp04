import { createEffect } from "solid-js";
import { configs } from "../configs";
import { drawWaveformGridCanvas } from "../lib/canvas-draw";
import {
  areSelectionsEqual,
  getBarIndexFromCanvasPoint,
  isBarInsideSelection,
  resolveDraggedSelection,
} from "../lib/selection";
import type { SelectionRange, WaveformBar } from "../types";

interface WaveformGridProps {
  waveformBars: WaveformBar[];
  selection: SelectionRange | null;
  disabled: boolean;
  onSelectRange: (selection: SelectionRange) => void;
  onPlaySelectionOnce: (selection: SelectionRange) => Promise<void> | void;
  onStartSelectionLoop: (selection: SelectionRange) => Promise<void> | void;
  onStopPlayback: () => void;
}

interface DragSession {
  pointerId: number;
  selection: SelectionRange;
  fromExistingSelection: boolean;
  holdTimer: number | null;
  didHold: boolean;
  target: HTMLCanvasElement;
}

export const WaveformGrid = (props: WaveformGridProps) => {
  let canvasElement: HTMLCanvasElement | undefined;
  let dragSession: DragSession | null = null;

  const rowCount = () =>
    Math.max(1, Math.ceil(props.waveformBars.length / configs.barsPerRow));
  const canvasHeight = () => `${rowCount() * configs.mainWaveformRowHeight}px`;

  const clearHoldTimer = () => {
    const activeSession = dragSession;
    if (activeSession && activeSession.holdTimer !== null) {
      window.clearTimeout(activeSession.holdTimer);
      activeSession.holdTimer = null;
    }
  };

  const startHoldTimer = () => {
    if (!dragSession) {
      return;
    }

    dragSession.holdTimer = window.setTimeout(() => {
      if (!dragSession) {
        return;
      }

      dragSession.didHold = true;
      props.onSelectRange(dragSession.selection);
      void props.onStartSelectionLoop(dragSession.selection);
    }, configs.holdToLoopMs);
  };

  const getSelectionFromPointer = (event: PointerEvent) => {
    if (!canvasElement) {
      return null;
    }

    const barIndex = getBarIndexFromCanvasPoint(
      event.clientX,
      event.clientY,
      canvasElement.getBoundingClientRect(),
      props.waveformBars.length,
    );

    if (barIndex === null) {
      return null;
    }

    if (dragSession?.fromExistingSelection) {
      return dragSession.selection;
    }

    return resolveDraggedSelection(
      dragSession?.selection.startBar ?? barIndex,
      barIndex,
    );
  };

  const handlePointerDown = (event: PointerEvent) => {
    const targetElement = event.currentTarget as HTMLCanvasElement | null;
    if (props.disabled || !canvasElement) {
      return;
    }
    if (!targetElement) {
      return;
    }

    const barIndex = getBarIndexFromCanvasPoint(
      event.clientX,
      event.clientY,
      canvasElement.getBoundingClientRect(),
      props.waveformBars.length,
    );

    if (barIndex === null) {
      return;
    }

    const existingSelection = isBarInsideSelection(props.selection, barIndex)
      ? props.selection
      : null;
    const nextSelection = existingSelection ?? {
      startBar: barIndex,
      length: 1,
    };

    dragSession = {
      pointerId: event.pointerId,
      selection: nextSelection,
      fromExistingSelection: Boolean(existingSelection),
      holdTimer: null,
      didHold: false,
      target: targetElement,
    };

    targetElement.setPointerCapture(event.pointerId);
    if (!existingSelection) {
      props.onSelectRange(nextSelection);
    }
    startHoldTimer();
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!dragSession || dragSession.pointerId !== event.pointerId) {
      return;
    }

    const nextSelection = getSelectionFromPointer(event);
    if (
      !nextSelection ||
      areSelectionsEqual(nextSelection, dragSession.selection)
    ) {
      return;
    }

    dragSession.selection = nextSelection;
    props.onSelectRange(nextSelection);
    if (dragSession.didHold) {
      void props.onStartSelectionLoop(nextSelection);
    }
  };

  const finishPointerSession = (event: PointerEvent) => {
    if (!dragSession || dragSession.pointerId !== event.pointerId) {
      return;
    }

    clearHoldTimer();
    const finalSelection = dragSession.selection;
    dragSession.target.releasePointerCapture(event.pointerId);

    if (dragSession.didHold) {
      props.onStopPlayback();
    } else {
      props.onSelectRange(finalSelection);
      void props.onPlaySelectionOnce(finalSelection);
    }

    dragSession = null;
  };

  createEffect(() => {
    if (canvasElement) {
      drawWaveformGridCanvas(
        canvasElement,
        props.waveformBars,
        props.selection,
      );
    }
  });

  return (
    <div class="canvas-wrap" style={{ height: canvasHeight() }}>
      <canvas
        class="canvas-surface main-waveform-canvas h-full w-full"
        onPointerCancel={finishPointerSession}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerSession}
        ref={canvasElement}
      />
    </div>
  );
};
