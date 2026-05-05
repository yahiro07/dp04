import { mergeProps } from "solid-js";
import { KnobFrame } from "./knob-frame";
import { UnitFrame } from "./unit-frame";

export function NumberSliderBoxView(props: {
  value: number;
  fracDigits?: number;
}) {
  return (
    <div class="border border-[#444] w-[48px] h-[28px] flex-c">
      {props.value.toFixed(props.fracDigits ?? 2)}
    </div>
  );
}

export function FeNumberSliderBox(inputProps: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  fracDigits?: number;
  onChange: (value: number) => void;
}) {
  const props = mergeProps(
    { min: 0, max: 1, step: 0.01, fracDigits: 2 },
    inputProps,
  );
  return (
    <UnitFrame label={props.label}>
      <KnobFrame
        value={props.value}
        min={props.min}
        max={props.max}
        step={props.step}
        onChange={props.onChange}
      >
        <NumberSliderBoxView
          value={props.value}
          fracDigits={props.fracDigits}
        />
      </KnobFrame>
    </UnitFrame>
  );
}
