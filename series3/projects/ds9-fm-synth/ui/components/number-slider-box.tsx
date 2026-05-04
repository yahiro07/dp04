import { KnobFrame } from "@ds9/ui/components/knob-frame";
import { UnitFrame } from "@ds9/ui/components/unit-frame";

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

export function FeNumberSliderBox(props: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  fracDigits?: number;
  onChange: (value: number) => void;
}) {
  const vm = {
    min: () => props.min ?? 0,
    max: () => props.max ?? 1,
    step: () => props.step ?? 0.01,
  };
  return (
    <UnitFrame label={props.label}>
      <KnobFrame
        value={props.value}
        min={vm.min()}
        max={vm.max()}
        step={vm.step()}
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
