interface RangeFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  accentClassName?: string;
  valueClassName?: string;
}

export function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  accentClassName = "accent-amber-500",
  valueClassName = "w-8 text-right font-mono",
}: RangeFieldProps) {
  return (
    <label className="flex items-center gap-3 text-sm text-stone-300">
      <span>{label}</span>
      <input
        className={accentClassName}
        max={max}
        min={min}
        onChange={(event) => {
          onChange(Number(event.target.value));
        }}
        step={step}
        type="range"
        value={value}
      />
      <span className={valueClassName}>{value}</span>
    </label>
  );
}
