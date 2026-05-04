import { JSX } from "solid-js/jsx-runtime";

export const Button = (props: {
  active?: boolean;
  text?: string;
  children?: JSX.Element;
  onClick?: () => void;
  disabled?: boolean;
}) => {
  return (
    <button
      type="button"
      onClick={props.onClick}
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
