import { JsxElement } from "@lib/ax-solid/types";

export type DrumKitToneId = "kick" | "snare" | "open-hi-hat" | "closed-hi-hat";

export type DrumSynthesizerUnit = {
  setupEngine(): AudioNode;
  playTone(toneId: DrumKitToneId): void;
  renderUi(props: { currentToneId: DrumKitToneId }): JsxElement;
};
