import { useCurrentSynthPatternPresenter } from "@/presenter/use-current-synth-pattern-presenter";
import { npx } from "@/ui/styling/styling-utils";

const GridBackground = ({
  nx,
  ny,
  width,
  height,
}: {
  nx: number;
  ny: number;
  width: number;
  height: number;
}) => {
  const cellW = width / nx;
  const cellH = height / ny;

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
        width: "640px",
        height: "320px",
        border: "solid 1px #888",
        position: "relative",
      }}
    >
      <GridBackground width={640} height={320} nx={32} ny={25} />
      {presenter.notes.map((note) => {
        const cellW = 640 / 32;
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
