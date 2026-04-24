import { Fragment } from "react";

import { pianoRollCellClass } from "../lib/groovebox-ui";

interface PianoRollProps {
  rowLabels: string[];
  rowValues: number[];
  stepCount: number;
  isActive: (stepIndex: number, midi: number) => boolean;
  onToggle: (stepIndex: number, midi: number) => void;
}

export function PianoRoll({
  rowLabels,
  rowValues,
  stepCount,
  isActive,
  onToggle,
}: PianoRollProps) {
  const steps = Array.from({ length: stepCount }, (_, stepIndex) => stepIndex);

  return (
    <div className="overflow-auto rounded-xl border border-stone-800">
      <div className="grid min-w-[960px] grid-cols-[64px_repeat(64,minmax(0,1fr))] gap-px bg-stone-900 p-px">
        <div className="bg-stone-950" />
        {steps.map((stepIndex) => (
          <div
            className="flex h-8 items-center justify-center bg-stone-950 text-[10px] text-stone-500"
            key={`melody-head-${stepIndex}`}
          >
            {stepIndex + 1}
          </div>
        ))}
        {rowValues.map((midi, rowIndex) => (
          <Fragment key={`piano-row-${midi}`}>
            <div className="flex h-8 items-center justify-center bg-stone-950 px-2 text-[10px] text-stone-400">
              {rowLabels[rowIndex]}
            </div>
            {steps.map((stepIndex) => (
              <button
                className={pianoRollCellClass(
                  isActive(stepIndex, midi),
                  stepIndex,
                )}
                key={`melody-cell-${midi}-${stepIndex}`}
                onClick={() => {
                  onToggle(stepIndex, midi);
                }}
                type="button"
              />
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
