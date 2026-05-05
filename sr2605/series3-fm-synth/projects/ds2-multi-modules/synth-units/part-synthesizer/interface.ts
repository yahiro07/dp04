import { JsxElement } from "@lib/ax-solid/types";

export type PartSynthesizerUnit = {
  setupEngine(): AudioNode;
  renderUi(): JsxElement;
};
