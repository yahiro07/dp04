import { JsxElement } from "@lib/ax-solid/types";

export type DrumSynthesizerUnit = {
  setupEngine(audioContext: AudioContext): AudioNode;
  renderUi(): JsxElement;
};
