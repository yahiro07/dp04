import { KnobFrame } from "@ds1/ui/components/knob-frame";
import { UnitFrame } from "@ds1/ui/components/unit-frame";
import { mapUnaryTo } from "@lib/ax/number-utils";

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

export function Knob(props: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  const vm = {
    min: () => props.min ?? 0,
    max: () => props.max ?? 1,
    step: () => props.step ?? 0.01,
  };
  return (
    <KnobFrame
      value={props.value}
      min={vm.min()}
      max={vm.max()}
      step={vm.step()}
      onChange={props.onChange}
    >
      <KnobView value={props.value} min={vm.min()} max={vm.max()} />
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
