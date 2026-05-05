import { mapUnaryTo } from "@my/lib/ax/number-utils";
import { mergeProps } from "solid-js";
import { KnobFrame } from "./knob-frame";
import { UnitFrame } from "./unit-frame";

export function KnobView(props: { value: number; min: number; max: number }) {
  const vm = {
    tickAngel() {
      const { value, min, max } = props;
      const normValue = (value - min) / (max - min);
      const halfRange = 135;
      const angle = mapUnaryTo(normValue, -halfRange, halfRange);
      return angle;
    },
  };
  return (
    <div class="border border-[#444] w-[36px] h-[36px] rounded-full">
      <div
        class="w-full h-full flex justify-center"
        style={{
          transform: `rotate(${vm.tickAngel()}deg)`,
        }}
      >
        <div class="w-[1px] h-[10px] bg-[#444]" />
      </div>
    </div>
  );
}

export function Knob(inputProps: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  const props = mergeProps({ min: 0, max: 1, step: 0.01 }, inputProps);
  return (
    <KnobFrame
      value={props.value}
      min={props.min}
      max={props.max}
      step={props.step}
      onChange={props.onChange}
    >
      <KnobView value={props.value} min={props.min} max={props.max} />
    </KnobFrame>
  );
}

export function FeKnob(props: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <UnitFrame label={props.label}>
      <Knob
        value={props.value}
        min={props.min}
        max={props.max}
        step={props.step}
        onChange={props.onChange}
      />
    </UnitFrame>
  );
}
