import { Button } from "@my/lib/mo-solid/components/button";
import { DrumKitToneId } from "./types";
import { createUiModel } from "./ui-model";
import { UnitEngine } from "./unit-engine";

export function UiRoot(props: {
  unitEngine: UnitEngine;
  currentToneId: DrumKitToneId;
}) {
  const uiModel = createUiModel(props.unitEngine);
  const vm = {
    playTone(toneId: DrumKitToneId) {
      uiModel.playTone(toneId);
    },
  };
  return (
    <div class=" h-[100px] flex-c border border-[#aaa] p-4">
      <div>fs2 drum synth {props.currentToneId}</div>
      <div>
        <Button text="kick" onClick={() => vm.playTone("kick")} />
      </div>
    </div>
  );
}
