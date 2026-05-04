import { configs } from "../configs";
import type { SelectionRange, WaveformBar } from "../types";
import { isBarInsideSelection } from "./selection";

const resizeCanvas = (canvas: HTMLCanvasElement) => {
  const pixelRatio = window.devicePixelRatio || 1;
  const displayWidth = Math.max(1, Math.floor(canvas.clientWidth * pixelRatio));
  const displayHeight = Math.max(
    1,
    Math.floor(canvas.clientHeight * pixelRatio),
  );

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  return context;
};

const drawEnvelopeShape = (
  context: CanvasRenderingContext2D,
  envelope: number[],
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
) => {
  context.fillStyle = color;

  const centerY = y + height / 2;
  const columnWidth = width / Math.max(1, envelope.length);

  for (let index = 0; index < envelope.length; index += 1) {
    const amplitude = envelope[index] ?? 0;
    const lineHeight = Math.max(1, amplitude * (height * 0.88));
    const lineX = x + index * columnWidth;
    context.fillRect(
      lineX,
      centerY - lineHeight / 2,
      Math.max(1, columnWidth),
      lineHeight,
    );
  }
};

export const drawPreviewWaveformCanvas = (
  canvas: HTMLCanvasElement,
  envelope: number[],
  beatLineRatios: number[],
  offsetRatio: number,
) => {
  const context = resizeCanvas(canvas);
  if (!context) {
    return;
  }

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#fdfcfb";
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "#d6d3d1";
  context.strokeRect(0.5, 0.5, width - 1, height - 1);

  context.strokeStyle = "rgba(120, 113, 108, 0.35)";
  context.lineWidth = 1;
  for (const ratio of beatLineRatios) {
    const x = Math.round(width * ratio) + 0.5;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }

  drawEnvelopeShape(
    context,
    envelope,
    0,
    0,
    width,
    height,
    "rgba(41, 37, 36, 0.85)",
  );

  const offsetX = Math.round(width * offsetRatio) + 0.5;
  context.strokeStyle = "#2563eb";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(offsetX, 0);
  context.lineTo(offsetX, height);
  context.stroke();
};

export const drawWaveformGridCanvas = (
  canvas: HTMLCanvasElement,
  waveformBars: WaveformBar[],
  selection: SelectionRange | null,
) => {
  const context = resizeCanvas(canvas);
  if (!context) {
    return;
  }

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const rowCount = Math.max(
    1,
    Math.ceil(waveformBars.length / configs.barsPerRow),
  );
  const columnWidth = width / configs.barsPerRow;
  const rowHeight = height / rowCount;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#fdfcfb";
  context.fillRect(0, 0, width, height);

  waveformBars.forEach((waveformBar) => {
    const rowIndex = Math.floor(waveformBar.barIndex / configs.barsPerRow);
    const columnIndex = waveformBar.barIndex % configs.barsPerRow;
    const x = columnIndex * columnWidth;
    const y = rowIndex * rowHeight;
    const isSelected = isBarInsideSelection(selection, waveformBar.barIndex);

    if (isSelected) {
      context.fillStyle = "rgba(37, 99, 235, 0.12)";
      context.fillRect(x, y, columnWidth, rowHeight);
    }

    context.strokeStyle = "rgba(214, 211, 209, 0.95)";
    context.lineWidth = 1;
    context.strokeRect(x + 0.5, y + 0.5, columnWidth - 1, rowHeight - 1);

    drawEnvelopeShape(
      context,
      waveformBar.envelope,
      x + 6,
      y + 12,
      columnWidth - 12,
      rowHeight - 24,
      waveformBar.hasAudio
        ? "rgba(41, 37, 36, 0.88)"
        : "rgba(168, 162, 158, 0.45)",
    );

    context.fillStyle = "#78716c";
    context.font = "11px Avenir Next, Hiragino Sans, sans-serif";
    context.fillText(`bar ${waveformBar.barIndex + 1}`, x + 8, y + 12);
  });
};
