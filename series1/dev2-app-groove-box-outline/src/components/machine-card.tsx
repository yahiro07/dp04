import {
  cardClass,
  chipButtonClass,
  toggleButtonClass,
} from "../lib/groovebox-ui";
import { getVariationLabel, VARIATIONS } from "../music";
import type { VariationIndex } from "../types";

interface MachineCardProps {
  active: boolean;
  title: string;
  description?: string;
  enabled?: boolean;
  selectedVariation?: VariationIndex;
  onSelect: () => void;
  onToggle?: (enabled: boolean) => void;
  onVariationSelect?: (variation: VariationIndex) => void;
}

export function MachineCard({
  active,
  title,
  description,
  enabled,
  selectedVariation,
  onSelect,
  onToggle,
  onVariationSelect,
}: MachineCardProps) {
  return (
    <div className={cardClass(active)}>
      <button className="flex-1 text-left" onClick={onSelect} type="button">
        <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
          Machine
        </p>
        <h2 className="mt-2 text-lg font-medium text-stone-100">{title}</h2>
      </button>
      {description ? (
        <p className="text-sm text-stone-400">{description}</p>
      ) : null}
      {enabled !== undefined &&
      onToggle &&
      selectedVariation !== undefined &&
      onVariationSelect ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            className={toggleButtonClass(enabled)}
            onClick={() => {
              onToggle(!enabled);
            }}
            type="button"
          >
            {enabled ? "ON" : "OFF"}
          </button>
          <div className="grid grid-cols-4 gap-1">
            {VARIATIONS.map((variation) => (
              <button
                className={chipButtonClass(selectedVariation === variation)}
                key={`${title}-variation-${variation}`}
                onClick={() => {
                  onVariationSelect(variation as VariationIndex);
                }}
                type="button"
              >
                {getVariationLabel(variation)}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
