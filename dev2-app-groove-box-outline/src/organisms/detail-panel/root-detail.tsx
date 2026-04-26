import { LabeledSelect } from "../../components/labeled-select";
import type { VariationIndex } from "../../types";

interface RootDetailProps {
  pattern: number[];
  variation: VariationIndex;
  onRootOffsetChange: (variation: VariationIndex, barIndex: number, rootOffset: number) => void;
}

export function RootDetail({ pattern, variation, onRootOffsetChange }: RootDetailProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {pattern.map((rootOffset, barIndex) => (
        <LabeledSelect
          key={`root-bar-${barIndex}`}
          label={`Bar ${barIndex + 1}`}
          onChange={(value) => {
            onRootOffsetChange(variation, barIndex, Number(value));
          }}
          options={Array.from({ length: 13 }, (_, index) => index - 6)}
          value={rootOffset}
        />
      ))}
    </div>
  );
}