import { JSX } from "solid-js/jsx-runtime";
import { render } from "solid-js/web";

type RootElement = HTMLElement & { disposeRender?: () => void };

export function mountAppRoot(fn: () => JSX.Element, rootElementId = "app") {
  const root = document.getElementById(rootElementId)! as RootElement;
  root.disposeRender?.(); //cleanup previous dom
  root.disposeRender = render(fn, root);
}
