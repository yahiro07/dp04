import { type Component, createEffect, onMount } from "solid-js";
import type { AnalysisDebugData } from "../lib/audioAnalysis";

interface Props {
  data: AnalysisDebugData;
}

const AnalysisDebugView: Component<Props> = (props) => {
  let canvas!: HTMLCanvasElement;

  function draw() {
    const { energy, onset, peakFrames, threshold } = props.data;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width;
    const H = canvas.height;
    const n = energy.length;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, W, H);

    const xOf = (frame: number) => (frame / n) * W;
    // Flip Y: value=1 → top (y=0), value=0 → bottom (y=H)
    const yOf = (v: number) => H - v * H;

    // --- RMS energy: filled area (gray) ---
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let f = 0; f < n; f++) {
      ctx.lineTo(xOf(f), yOf(energy[f]));
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = "rgba(120,120,140,0.6)";
    ctx.fill();

    // --- Onset strength: line (orange) ---
    ctx.beginPath();
    for (let f = 0; f < n; f++) {
      const x = xOf(f);
      const y = yOf(onset[f]);
      if (f === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "rgba(255,160,50,0.9)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // --- Threshold: dashed horizontal line (yellow) ---
    const ty = yOf(threshold);
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(0, ty);
    ctx.lineTo(W, ty);
    ctx.strokeStyle = "rgba(255,230,50,0.7)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // --- Peak positions: vertical lines (red) ---
    for (const pf of peakFrames) {
      const x = xOf(pf);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.strokeStyle = "rgba(255,60,60,0.9)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // --- Legend (small text) ---
    const legend = [
      { color: "rgba(120,120,140,0.9)", label: "RMS energy" },
      { color: "rgba(255,160,50,0.9)", label: "Onset strength" },
      { color: "rgba(255,230,50,0.9)", label: "Threshold" },
      { color: "rgba(255,60,60,0.9)", label: "Beat peaks" },
    ];
    ctx.font = "10px monospace";
    legend.forEach(({ color, label }, i) => {
      const lx = 6;
      const ly = 12 + i * 14;
      ctx.fillStyle = color;
      ctx.fillRect(lx, ly - 7, 10, 8);
      ctx.fillStyle = "#ccc";
      ctx.fillText(label, lx + 14, ly);
    });
  }

  onMount(() => {
    draw();
  });

  createEffect(() => {
    // Track reactive dependency on data fields
    void props.data.energy;
    void props.data.onset;
    void props.data.peakFrames;
    draw();
  });

  return (
    <canvas
      ref={canvas}
      width={600}
      height={120}
      class="w-full border border-gray-600 block"
      style={{ "image-rendering": "pixelated" }}
    />
  );
};

export default AnalysisDebugView;
