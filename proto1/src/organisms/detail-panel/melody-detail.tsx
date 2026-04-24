import { useMemo } from "react";

import { PianoRoll } from "../../components/piano-roll";
import { RangeField } from "../../components/range-field";
import {
  getMelodyNoteLabel,
  MELODY_BASE_NOTE,
  MELODY_ROW_COUNT,
} from "../../music";
import type { VariationIndex } from "../../types";

interface MelodyDetailProps {
  melodyOctaveShift: number;
  notes: { midi: number; step: number; durationSteps: number }[];
  variation: VariationIndex;
  onMelodyOctaveShift: (octaveShift: number) => void;
  onToggleMelody: (
    variation: VariationIndex,
    stepIndex: number,
    midi: number,
  ) => void;
}

export function MelodyDetail({
  melodyOctaveShift,
  notes,
  variation,
  onMelodyOctaveShift,
  onToggleMelody,
}: MelodyDetailProps) {
  const noteSet = useMemo(
    () => new Set(notes.map((note) => `${note.step}:${note.midi}`)),
    [notes],
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="shrink-0">
        <RangeField
          label="Octave Shift"
          max={2}
          min={-2}
          onChange={onMelodyOctaveShift}
          value={melodyOctaveShift}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-4">
          <PianoRoll
            isActive={(stepIndex, midi) => noteSet.has(`${stepIndex}:${midi}`)}
            onToggle={(stepIndex, midi) => {
              onToggleMelody(variation, stepIndex, midi);
            }}
            rowLabels={Array.from({ length: MELODY_ROW_COUNT }, (_, rowIndex) =>
              getMelodyNoteLabel(
                MELODY_BASE_NOTE + (MELODY_ROW_COUNT - rowIndex - 1),
              ),
            )}
            rowValues={Array.from(
              { length: MELODY_ROW_COUNT },
              (_, rowIndex) =>
                MELODY_BASE_NOTE + (MELODY_ROW_COUNT - rowIndex - 1),
            )}
            stepCount={64}
          />
          <p className="text-xs text-stone-500">
            PoCではクリックごとに固定8分音符長のノートを配置します。
          </p>
        </div>
      </div>
    </div>
  );
}
