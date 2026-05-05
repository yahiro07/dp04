import { JsxElement } from "@lib/ax-solid/types";

export function UnitFrame(props: { children: JsxElement; label: string }) {
  return (
    <div class="flex-vc">
      <div class="text-[16px]">{props.label}</div>
      <div class="flex-vl gap-2 h-[40px] flex-c">{props.children}</div>
    </div>
  );
}
