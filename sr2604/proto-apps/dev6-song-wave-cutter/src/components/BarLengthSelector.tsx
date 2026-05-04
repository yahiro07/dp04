import type { Component } from "solid-js";
import { BAR_LENGTH_OPTIONS, barLengthLabel } from "../store";

interface Props {
  index: number;
  onChange: (index: number) => void;
}

/**
 * A single button-like control whose left half selects the previous option
 * and right half selects the next option.
 * Displays: ◀  <value>  ▶
 */
const BarLengthSelector: Component<Props> = (props) => {
  const label = () => barLengthLabel(BAR_LENGTH_OPTIONS[props.index]);

  function handleClick(e: MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isLeft = e.clientX < rect.left + rect.width / 2;
    if (isLeft && props.index > 0) {
      props.onChange(props.index - 1);
    } else if (!isLeft && props.index < BAR_LENGTH_OPTIONS.length - 1) {
      props.onChange(props.index + 1);
    }
  }

  return (
    <button
      type="button"
      class="relative inline-flex items-center justify-center w-24 h-8 border border-gray-400 select-none cursor-pointer bg-white hover:bg-gray-50"
      onClick={handleClick}
    >
      <span class="absolute left-1 text-gray-400 text-xs pointer-events-none">
        ◀
      </span>
      <span class="text-sm font-mono">{label()}</span>
      <span class="absolute right-1 text-gray-400 text-xs pointer-events-none">
        ▶
      </span>
    </button>
  );
};

export default BarLengthSelector;
