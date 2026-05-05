import { DrumKitToneId } from "@ds2/synth-units/drum-synthesizer/types";
import { createUiModel } from "@ds2/synth-units/drum-synthesizer/ui-model";
import { UnitEngine } from "@ds2/synth-units/drum-synthesizer/unit-engine";
import { Button } from "@lib/mo-solid/components/button";

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
    <div class="w-[200px] h-[100px] flex-c border border-[#aaa]">
      <div>drum synth {props.currentToneId}</div>
      <div>
        <Button text="kick" onClick={() => vm.playTone("kick")} />
      </div>
    </div>
  );
}
