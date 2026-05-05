import { clampValue } from "@my/lib/ax/number-utils";
import { JsxElement } from "@my/lib/ax-solid/types";
import { startDragSession } from "@my/lib/mo/drag-session";

export function KnobFrame(props: {
  value: number;
  min: number;
  max: number;
  step: number;
  children: JsxElement;
  onChange: (value: number) => void;
  dragRange?: number;
}) {
  const handlePointerDown = (e0: PointerEvent) => {
    const min = props.min;
    const max = props.max;
    const step = props.step;
    const dragRange = props.dragRange ?? 100;

    const originalValue = props.value;
    startDragSession(e0, {
      onMove(e) {
        const delta =
          -(e.position.y - e.originalPosition.y) / (dragRange / (max - min));
        let newValue = originalValue + delta;
        if (step > 0) {
          newValue = Math.round(newValue / step) * step;
        }
        newValue = clampValue(newValue, min, max);
        props.onChange(newValue);
      },
    });
  };
  return (
    <div onPointerDown={handlePointerDown} class="cursor-pointer">
      {props.children}
    </div>
  );
}
