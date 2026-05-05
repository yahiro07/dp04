import { JsxElement } from "@lib/ax-solid/types";

export type MainSynthesizerUnit = {
  setupEngine(): AudioNode;
  renderUi(): JsxElement;
};
