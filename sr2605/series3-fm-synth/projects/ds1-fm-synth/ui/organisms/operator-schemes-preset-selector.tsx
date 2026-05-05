import type { OperatorScheme } from "@ds1/base/types";
import { setupHandleClickOutside } from "@lib/mo/handle-click-outside";
import { Button } from "@lib/mo-solid/components/button";
import { createEffect, createMemo, createSignal, Show } from "solid-js";

export function OperatorSchemesPresetSelector(props: {
  operatorSchemes: OperatorScheme[];
  setOperatorSchemes: (operatorSchemes: OperatorScheme[]) => void;
}) {
  const presets: OperatorScheme[][] = [
    ["C", "C", "M", "C"],
    ["C", "M", "M", "C"],
    ["M", "M", "M", "C"],
    ["C", "C", "C", "C"],
    ["M", "C", "M", "C"],
    ["C", "J", "M", "C"],
    ["J", "M", "M", "C"],
    ["J2", "J", "M", "C"],
  ];
  const currentPresetIndex = createMemo(() => {
    const target = JSON.stringify(props.operatorSchemes);
    return presets.findIndex((op) => JSON.stringify(op) === target);
  });

  const [btVisible, setBtVisible] = createSignal(false);

  let elModalButtonPlane: HTMLDivElement | undefined;
  let disposeOutside: (() => void) | undefined;

  const handlers = {
    shiftPreset() {
      const nextIndex = currentPresetIndex() + 1;
      props.setOperatorSchemes(presets[nextIndex % presets.length]);
    },
    toggleButtonVisible() {
      setBtVisible(!btVisible());
    },
  };

  createEffect(() => {
    if (btVisible() && elModalButtonPlane) {
      disposeOutside = setupHandleClickOutside(elModalButtonPlane, (e) => {
        setBtVisible(false);
        disposeOutside?.();
        disposeOutside = undefined;
        e.stopPropagation();
      });
    }
  });

  return (
    <div class="flex-h">
      <Button onClick={handlers.toggleButtonVisible}>preset</Button>
      <Show when={btVisible()}>
        <div ref={elModalButtonPlane}>
          <Button onClick={handlers.shiftPreset}>
            {currentPresetIndex() === -1 ? "--" : currentPresetIndex() + 1}
          </Button>
        </div>
      </Show>
    </div>
  );
}
