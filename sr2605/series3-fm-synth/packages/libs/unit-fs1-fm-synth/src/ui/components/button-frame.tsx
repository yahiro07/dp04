import { JsxElement } from "@my/lib/ax-solid/types";

export function ButtonFrame(props: {
  children: JsxElement;
  onClick: () => void;
}) {
  return (
    <div onClick={props.onClick} class="cursor-pointer">
      {props.children}
    </div>
  );
}
