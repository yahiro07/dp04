import { JsxElement } from "@my/lib/ax-solid/types";

export type SequencerUnit = {
  setupSequencerEngine(): void;
  renderUi(): JsxElement;
};
