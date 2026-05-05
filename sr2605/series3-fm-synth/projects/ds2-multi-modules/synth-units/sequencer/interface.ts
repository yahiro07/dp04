import { JsxElement } from "@lib/ax-solid/types";

export type SequencerUnit = {
  setupSequencerEngine(): void;
  renderUi(): JsxElement;
};
