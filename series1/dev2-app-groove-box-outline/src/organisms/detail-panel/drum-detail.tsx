import { StepGrid } from "../../components/step-grid";
import { DRUM_LANES } from "../../music";
import type { VariationIndex } from "../../types";

interface DrumDetailProps {
  pattern: boolean[][];
  variation: VariationIndex;
  onToggleDrum: (variation: VariationIndex, laneIndex: number, stepIndex: number) => void;
}

export function DrumDetail({ pattern, variation, onToggleDrum }: DrumDetailProps) {
  return (
    <StepGrid
      labelColumnClassName="grid-cols-[80px_repeat(16,minmax(0,1fr))]"
      laneLabels={DRUM_LANES}
      onToggle={(laneIndex, stepIndex) => {
        onToggleDrum(variation, laneIndex, stepIndex);
      }}
      pattern={pattern}
    />
  );
}