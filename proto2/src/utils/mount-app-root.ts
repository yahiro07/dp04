import { ReactNode } from "react";
import { createRoot, Root } from "react-dom/client";

type IAppDiv = HTMLDivElement & { __reactRoot: Root };

export function mountAppRoot(rootNode: ReactNode, rootDivId: string) {
  const appDiv = document.getElementById(rootDivId) as IAppDiv;
  appDiv.__reactRoot ??= createRoot(appDiv);
  appDiv.__reactRoot.render(rootNode);
}
