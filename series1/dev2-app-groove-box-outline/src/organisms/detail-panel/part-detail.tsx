import { RangeField } from "../../components/range-field";
import { StepGrid } from "../../components/step-grid";
import { PART_LANES } from "../../music";
import type { PartMachineId, VariationIndex } from "../../types";

interface PartDetailProps {
  machine: { patterns: boolean[][][]; octaveShift: number };
  machineId: PartMachineId;
  variation: VariationIndex;
  onOctaveShiftChange: (machineId: PartMachineId, octaveShift: number) => void;
  onTogglePart: (machineId: PartMachineId, variation: VariationIndex, laneIndex: number, stepIndex: number) => void;
}

export function PartDetail({
  machine,
  machineId,
  variation,
  onOctaveShiftChange,
  onTogglePart,
}: PartDetailProps) {
  return (
    <div className="space-y-4">
      <RangeField
        label="Octave Shift"
        max={2}
        min={-2}
        onChange={(octaveShift) => {
          onOctaveShiftChange(machineId, octaveShift);
        }}
        value={machine.octaveShift}
      />
      <StepGrid
        labelColumnClassName="grid-cols-[50px_repeat(16,minmax(0,1fr))]"
        laneLabels={PART_LANES}
        onToggle={(laneIndex, stepIndex) => {
          onTogglePart(machineId, variation, laneIndex, stepIndex);
        }}
        pattern={machine.patterns[variation]}
      />
    </div>
  );
}