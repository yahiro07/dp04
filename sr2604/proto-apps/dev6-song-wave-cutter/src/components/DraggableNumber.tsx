import type { Component } from "solid-js";

interface Props {
  value: number;
  min?: number;
  onChange: (value: number) => void;
}

/**
 * An integer display that can be adjusted by up/down drag.
 * Drag up → increase, drag down → decrease. Sensitivity: 10 px per step.
 */
const DraggableNumber: Component<Props> = (props) => {
  let startY = 0;
  let startValue = 0;

  function handleMouseDown(e: MouseEvent) {
    e.preventDefault();
    startY = e.clientY;
    startValue = props.value;

    function onMouseMove(ev: MouseEvent) {
      const dy = startY - ev.clientY; // positive = upward drag
      const delta = Math.floor(dy / 10);
      const newValue = Math.max(props.min ?? 0, startValue + delta);
      if (newValue !== props.value) {
        props.onChange(newValue);
      }
    }

    function onMouseUp() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  return (
    <div
      class="inline-flex items-center justify-center w-16 h-8 border border-gray-400 cursor-ns-resize select-none bg-white font-mono text-sm"
      onMouseDown={handleMouseDown}
      title="Drag up/down to change"
    >
      {props.value}
    </div>
  );
};

export default DraggableNumber;
