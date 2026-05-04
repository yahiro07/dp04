import { createEffect } from "solid-js";
import { drawPreviewWaveformCanvas } from "../lib/canvas-draw";

interface OffsetAdjusterProps {
  envelope: number[];
  beatLineRatios: number[];
  draftOffsetRatio: number;
  draftOffsetSamples: number;
  disabled: boolean;
  onChangeOffsetRatio: (ratio: number) => void;
  onApply: () => void;
}

export const OffsetAdjuster = (props: OffsetAdjusterProps) => {
  let canvasElement: HTMLCanvasElement | undefined;
  let activePointerId: number | null = null;

  const updateOffsetFromPointer = (event: PointerEvent) => {
    if (!canvasElement) {
      return;
    }

    const canvasRect = canvasElement.getBoundingClientRect();
    const ratio = (event.clientX - canvasRect.left) / canvasRect.width;
    props.onChangeOffsetRatio(ratio);
  };

  const handlePointerDown = (event: PointerEvent) => {
    const targetElement = event.currentTarget as HTMLCanvasElement | null;
    if (props.disabled) {
      return;
    }
    if (!targetElement) {
      return;
    }

    activePointerId = event.pointerId;
    targetElement.setPointerCapture(event.pointerId);
    updateOffsetFromPointer(event);
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (activePointerId !== event.pointerId) {
      return;
    }

    updateOffsetFromPointer(event);
  };

  const clearPointer = (event: PointerEvent) => {
    const targetElement = event.currentTarget as HTMLCanvasElement | null;
    if (activePointerId === event.pointerId) {
      activePointerId = null;
      targetElement?.releasePointerCapture(event.pointerId);
    }
  };

  createEffect(() => {
    if (canvasElement) {
      drawPreviewWaveformCanvas(
        canvasElement,
        props.envelope,
        props.beatLineRatios,
        props.draftOffsetRatio,
      );
    }
  });

  return (
    <section class="panel flex-v">
      <div class="panel-header flex-ha">
        <div class="flex-v gap-1">
          <span class="label-text">song offset</span>
          <span class="meta-text">
            drag in the first 2 seconds to set the song start
          </span>
        </div>
        <button
          class="action-button"
          disabled={props.disabled}
          onClick={props.onApply}
          type="button"
        >
          apply
        </button>
      </div>
      <div class="panel-body flex-v">
        <div class="canvas-wrap offset-canvas">
          <canvas
            class="canvas-surface h-full w-full"
            onPointerCancel={clearPointer}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={clearPointer}
            ref={canvasElement}
          />
        </div>
        <div class="meta-text">offset samples: {props.draftOffsetSamples}</div>
      </div>
    </section>
  );
};
