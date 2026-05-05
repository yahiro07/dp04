import { HoldableButton } from "@my/lib/mo-solid/components/holdable-button";
import { createUiModel } from "@/synth-units/main-synthesizer/ui-model";
import { UnitEngine } from "@/synth-units/main-synthesizer/unit-engine";

export function UiRoot(props: { unitEngine: UnitEngine }) {
  const uiModel = createUiModel(props.unitEngine);
  const vm = {
    noteOn(noteNumber: number) {
      uiModel.noteOn(0, noteNumber, 1);
    },
    noteOff(noteNumber: number) {
      uiModel.noteOff(0, noteNumber);
    },
  };
  return (
    <div class="h-[100px] flex-c border border-[#aaa]">
      <div>main synth</div>

      <div class="flex-h">
        <HoldableButton
          text="note C"
          onDown={() => vm.noteOn(60)}
          onUp={() => vm.noteOff(60)}
        />
        <HoldableButton
          text="note D"
          onDown={() => vm.noteOn(62)}
          onUp={() => vm.noteOff(62)}
        />
        <HoldableButton
          text="note E"
          onDown={() => vm.noteOn(64)}
          onUp={() => vm.noteOff(64)}
        />
      </div>
    </div>
  );
}
