import { useCurrentSynthPatternPresenter } from "@/presenter/use-current-synth-pattern-presenter";
import { npx } from "@/ui/styling/styling-utils";

const GridBackground = ({
  nx,
  ny,
  width,
  height,
  bgAlterStrideX,
}: {
  nx: number;
  ny: number;
  width: number;
  height: number;
  bgAlterStrideX?: number;
}) => {
  const cellW = width / nx;
  const cellH = height / ny;

  const bgAlterStride = bgAlterStrideX ?? 0;

  return (
    <div
      css={{
        position: "absolute",
        left: npx(0),
        top: npx(0),
        width: npx(width),
        height: npx(height),
      }}
    >
      {Array.from({ length: nx * ny }).map((_, i) => {
        const xi = i % nx;
        const yi = Math.floor(i / nx);
        const x = xi * cellW;
        const y = yi * cellH;
        const bgAlter = xi % (bgAlterStride * 2) < bgAlterStride;
        return (
          <div
            key={`${xi}-${yi}`}
            css={{
              position: "absolute",
              left: npx(x),
              top: npx(y),
              width: npx(cellW),
              height: npx(cellH),
              border: "solid 1px #ddd",
              backgroundColor: bgAlter ? "#fff" : "#f0f0f0",
            }}
          />
        );
      })}
    </div>
  );
};

export const SynthPatternEditorView = () => {
  const presenter = useCurrentSynthPatternPresenter();
  return (
    <div
      css={{
        width: "320px",
        height: "320px",
        position: "relative",
      }}
    >
      <GridBackground
        width={320}
        height={320}
        nx={16}
        ny={25}
        bgAlterStrideX={4}
      />
      {presenter.notes.map((note) => {
        const cellW = 320 / 16;
        const cellH = 320 / 25;
        const baseY = 160;
        const noteY = baseY - note.relativeNoteNumber * cellH;
        const noteH = cellH;
        const noteX = note.stepPosition * cellW;
        const noteW = note.stepDuration * cellW;
        return (
          <div
            key={`${note.stepPosition}-${note.stepDuration}-${note.relativeNoteNumber}`}
            css={{
              position: "absolute",
              left: npx(noteX),
              top: npx(noteY - noteH / 2),
              width: npx(noteW),
              height: npx(noteH),
              backgroundColor: "#4682b4",
            }}
          />
        );
      })}
    </div>
  );
};
