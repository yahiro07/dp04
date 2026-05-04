import { ButtonFrame } from "@ds9/ui/components/button-frame";
import { UnitFrame } from "@ds9/ui/components/unit-frame";
import { SelectorOption } from "@lib/mo/selector-option";

export function SelectorBoxView(props: { valueText: string }) {
  return (
    <div class="border border-[#444] w-[48px] h-[28px] flex-c">
      {props.valueText}
    </div>
  );
}

export function FeSelectorBox<T extends number>(props: {
  options: SelectorOption<T>[];
  value: T;
  label: string;
  onChange: (value: T) => void;
}) {
  const vm = {
    valueText() {
      return (
        props.options.find((opt) => opt.value === props.value)?.label ?? "??"
      );
    },
    handleClick() {
      const index = props.options.findIndex((opt) => opt.value === props.value);
      const nextIndex = (index + 1) % props.options.length;
      props.onChange(props.options[nextIndex].value);
    },
  };
  return (
    <UnitFrame label={props.label}>
      <ButtonFrame onClick={vm.handleClick}>
        <SelectorBoxView valueText={vm.valueText()} />
      </ButtonFrame>
    </UnitFrame>
  );
}
