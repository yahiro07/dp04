import { JsxElement } from "@lib/ax-solid/types";

export type SequencerUnit = {
  setupSequencerEngine(audioContext: AudioContext): void;
  renderUi(): JsxElement;
};
