import type { ReactNode } from "react";

interface LabeledSelectProps<T extends string | number> {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  renderOption?: (value: T) => ReactNode;
  className?: string;
}

export function LabeledSelect<T extends string | number>({
  label,
  value,
  options,
  onChange,
  renderOption,
  className = "rounded-xl border border-stone-700 bg-stone-900 px-3 py-2 text-sm",
}: LabeledSelectProps<T>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm text-stone-300">{label}</span>
      <select
        className={className}
        onChange={(event) => {
          const rawValue = event.target.value;
          const nextValue =
            typeof value === "number" ? Number(rawValue) : rawValue;
          onChange(nextValue as T);
        }}
        value={value}
      >
        {options.map((option) => (
          <option key={`${label}-${option}`} value={option}>
            {renderOption ? renderOption(option) : option}
          </option>
        ))}
      </select>
    </label>
  );
}
