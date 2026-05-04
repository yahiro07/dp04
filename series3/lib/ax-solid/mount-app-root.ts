import { JSX } from "solid-js/jsx-runtime";
import { render } from "solid-js/web";

export function mountAppRoot(fn: () => JSX.Element, rootElementId = "app") {
  const root = document.getElementById(rootElementId)!;
  render(fn, root);
}
