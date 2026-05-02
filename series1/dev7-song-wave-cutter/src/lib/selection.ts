import { configs } from "../configs";
import type { SelectionRange } from "../types";

export const isBarInsideSelection = (
  selection: SelectionRange | null,
  barIndex: number,
) => {
  if (!selection) {
    return false;
  }

  return (
    barIndex >= selection.startBar &&
    barIndex < selection.startBar + selection.length
  );
};

export const resolveDraggedSelection = (
  anchorBar: number,
  hoveredBar: number,
): SelectionRange => {
  const rawLength = Math.max(1, hoveredBar - anchorBar + 1);
  const resolvedLength =
    configs.allowedSelectionLengths.find((length) => rawLength <= length) ??
    configs.allowedSelectionLengths[configs.allowedSelectionLengths.length - 1];

  return {
    startBar: anchorBar,
    length: resolvedLength,
  };
};

export const areSelectionsEqual = (
  left: SelectionRange | null,
  right: SelectionRange | null,
) => {
  if (!left || !right) {
    return left === right;
  }

  return left.startBar === right.startBar && left.length === right.length;
};

export const getBarIndexFromCanvasPoint = (
  clientX: number,
  clientY: number,
  canvasRect: DOMRect,
  barCount: number,
) => {
  const relativeX = clientX - canvasRect.left;
  const relativeY = clientY - canvasRect.top;

  if (
    relativeX < 0 ||
    relativeY < 0 ||
    relativeX > canvasRect.width ||
    relativeY > canvasRect.height
  ) {
    return null;
  }

  const rowCount = Math.ceil(barCount / configs.barsPerRow);
  const columnWidth = canvasRect.width / configs.barsPerRow;
  const rowHeight = canvasRect.height / rowCount;
  const columnIndex = Math.min(
    configs.barsPerRow - 1,
    Math.floor(relativeX / columnWidth),
  );
  const rowIndex = Math.min(rowCount - 1, Math.floor(relativeY / rowHeight));
  const barIndex = rowIndex * configs.barsPerRow + columnIndex;

  return barIndex >= barCount ? null : barIndex;
};
