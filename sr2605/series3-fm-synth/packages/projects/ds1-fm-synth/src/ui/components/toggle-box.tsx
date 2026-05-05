import { ButtonFrame } from "@/ui/components/button-frame";
import { UnitFrame } from "@/ui/components/unit-frame";

function ToggleBoxView(props: { checked: boolean }) {
  return (
    <div
      class="w-[24px] h-[24px] border border-[#888] cursor-pointer"
      style={{ background: props.checked ? "#cfc" : "#fff" }}
    />
  );
}

export function ToggleBox(props: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <ButtonFrame onClick={() => props.onChange(!props.checked)}>
      <ToggleBoxView checked={props.checked} />
    </ButtonFrame>
  );
}

export function FeToggleBox(props: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <UnitFrame label={props.label}>
      <ToggleBox checked={props.checked} onChange={props.onChange} />
    </UnitFrame>
  );
}
