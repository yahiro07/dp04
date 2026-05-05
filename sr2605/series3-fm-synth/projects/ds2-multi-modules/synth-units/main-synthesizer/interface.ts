import { JsxElement } from "@lib/ax-solid/types";

export type MainSynthesizerUnit = {
  setupEngine(): AudioNode;
  noteOn(ch: number, noteNumber: number, velocity: number): void;
  noteOff(ch: number, noteNumber: number): void;
  renderUi(): JsxElement;
};
