import clsx from "clsx";
import type { PianoRollViewModel } from "@/lib/piano-roll-support";

interface PianoRollProps {
  viewModel: PianoRollViewModel;
  onBarClick: (barIndex: number) => void;
}

export function PianoRoll(props: PianoRollProps) {
  const { onBarClick, viewModel } = props;

  return (
    <div className="min-w-0 flex-1 overflow-auto bg-white">
      <div
        className="relative"
        style={{
          width: viewModel.containerWidth,
          minHeight: viewModel.containerMinHeight,
        }}
      >
        <div className="sticky top-0 z-10 flex bg-stone-50/95 backdrop-blur">
          <div
            className="shrink-0 border-b border-r border-stone-300 px-2 py-2 text-xs font-medium uppercase tracking-wide text-stone-500"
            style={{ width: viewModel.labelWidth }}
          >
            Notes
          </div>
          <div
            className="relative border-b border-stone-300"
            style={{
              width: viewModel.gridWidth,
              height: viewModel.headerHeight,
            }}
          >
            {viewModel.headerBars.map((bar) => {
              return (
                <button
                  key={bar.key}
                  className={clsx(
                    "absolute top-0 h-full border-l bg-transparent text-left text-xs text-stone-600",
                    bar.borderClass,
                    bar.isHighlighted && "bg-amber-200/45",
                  )}
                  style={{ left: bar.left, width: bar.width }}
                  onClick={() => onBarClick(bar.barIndex)}
                  type="button"
                >
                  <span className="pointer-events-none absolute left-2 top-2">
                    {bar.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex">
          <div
            className="sticky left-0 z-10 shrink-0 border-r border-stone-300 bg-stone-50"
            style={{ width: viewModel.labelWidth }}
          >
            {viewModel.noteLabels.map((row) => {
              return (
                <div
                  key={row.key}
                  className={clsx(
                    "flex items-center justify-end border-t px-2 text-xs text-stone-500",
                    row.borderClass,
                  )}
                  style={{ height: row.height }}
                >
                  {row.label}
                </div>
              );
            })}
          </div>

          <div
            className="relative"
            style={{ width: viewModel.gridWidth, height: viewModel.gridHeight }}
          >
            {viewModel.gridRows.map((row) => {
              return (
                <div
                  key={row.key}
                  className={clsx(
                    "absolute left-0 w-full border-t",
                    row.borderClass,
                  )}
                  style={{ top: row.top, height: row.height }}
                />
              );
            })}

            {viewModel.gridBars.map((bar) => {
              return (
                <div
                  key={bar.key}
                  className={clsx(
                    "absolute top-0 h-full border-l",
                    bar.borderClass,
                    bar.isHighlighted && "bg-amber-100/50",
                  )}
                  style={{ left: bar.left, width: bar.width }}
                />
              );
            })}

            {viewModel.notes.map((note) => {
              return (
                <div
                  key={note.id}
                  className="absolute rounded-sm border"
                  style={{
                    top: note.top,
                    left: note.left,
                    width: note.width,
                    height: note.height,
                    borderColor: note.borderColor,
                    backgroundColor: note.backgroundColor,
                  }}
                  title={note.title}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
