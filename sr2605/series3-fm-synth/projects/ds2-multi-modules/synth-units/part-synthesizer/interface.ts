import { JsxElement } from "@lib/ax-solid/types";

export type PartSynthesizerUnit = {
  setupEngine(audioContext: AudioContext): AudioNode;
  renderUi(): JsxElement;
};
