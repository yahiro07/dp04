import { HoldableButton } from "@my/lib/mo-solid/components/holdable-button";
import { FeKnob, FeSelectorBox } from "@my/lib/mo-solid/synth-components";
import { oscWaveOptions, UnitParameters } from "@/parameters";
import { createUiModel } from "@/ui-model";
import { UnitEngine } from "@/unit-engine";

export function UiRoot(props: { unitEngine: UnitEngine }) {
  const uiModel = createUiModel(props.unitEngine);
  const vm = {
    parameters() {
      return uiModel.state.parameters;
    },
    setParameter(key: keyof UnitParameters, value: number) {
      uiModel.setParameter(key, value);
    },
    noteOn(noteNumber: number) {
      uiModel.noteOn(0, noteNumber);
    },
    noteOff(noteNumber: number) {
      uiModel.noteOff(0, noteNumber);
    },
  };
  return (
    <div class="flex-c gap-4 border border-[#aaa] p-4">
      <div>tone synth</div>

      <div class="flex-h gap-2">
        <FeSelectorBox
          label="wave"
          options={oscWaveOptions}
          value={vm.parameters().oscWave}
          onChange={(v) => vm.setParameter("oscWave", v)}
        />
        <FeKnob
          label="pitch"
          value={vm.parameters().oscPitch}
          onChange={(v) => vm.setParameter("oscPitch", v)}
        />
      </div>

      <div class="flex-h gap-1">
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
