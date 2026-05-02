import { stepCellClass } from "../lib/groovebox-ui";

interface StepGridProps {
  laneLabels: readonly string[];
  pattern: boolean[][];
  labelColumnClassName: string;
  onToggle: (laneIndex: number, stepIndex: number) => void;
}

export function StepGrid({
  laneLabels,
  pattern,
  labelColumnClassName,
  onToggle,
}: StepGridProps) {
  return (
    <div className="space-y-3">
      {pattern.map((lane, laneIndex) => (
        <div
          className={`grid ${labelColumnClassName} gap-1`}
          key={`lane-${laneLabels[laneIndex]}`}
        >
          <div className="flex items-center text-sm text-stone-300">
            {laneLabels[laneIndex]}
          </div>
          {lane.map((isActive, stepIndex) => (
            <button
              className={stepCellClass(isActive, stepIndex)}
              key={`step-${laneIndex}-${stepIndex}`}
              onClick={() => {
                onToggle(laneIndex, stepIndex);
              }}
              type="button"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
