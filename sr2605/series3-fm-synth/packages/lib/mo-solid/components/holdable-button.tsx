import { startDragSession } from "@my/lib/mo/drag-session";
import { JSX } from "solid-js/jsx-runtime";

export const HoldableButton = (props: {
  active?: boolean;
  text?: string;
  children?: JSX.Element;
  onDown?: () => void;
  onUp?: () => void;
  disabled?: boolean;
  withPointerCapture?: boolean;
}) => {
  const handlePointerDown = (e: PointerEvent) => {
    startDragSession(e, {
      onDown() {
        props.onDown?.();
      },
      onUp() {
        props.onUp?.();
      },
      onCancel() {
        props.onUp?.();
      },
    });
  };
  return (
    <button
      type="button"
      onPointerDown={
        props.withPointerCapture ? handlePointerDown : props.onDown
      }
      onPointerUp={props.withPointerCapture ? undefined : props.onUp}
      onPointerCancel={props.withPointerCapture ? undefined : props.onUp}
      disabled={props.disabled}
      class="min-w-[60px] h-[36px] border border-[#888] rounded"
      style={{
        "background-color": props.active ? "#ccffcc" : "#fff",
        cursor: props.disabled ? "default" : "pointer",
        opacity: props.disabled ? 0.5 : 1,
      }}
    >
      {props.text && <span>{props.text}</span>}
      {props.children}
    </button>
  );
};
