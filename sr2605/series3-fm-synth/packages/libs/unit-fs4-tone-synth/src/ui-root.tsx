import { Button } from "@my/lib/mo-solid/components/button";
import { HoldableButton } from "@my/lib/mo-solid/components/holdable-button";
import { FeKnob, FeSelectorBox } from "@my/lib/mo-solid/synth-components";
import { oscWaveOptions } from "@/parameters";
import { createUiModel } from "@/ui-model";
import { UnitEngine } from "@/unit-engine";

export function UiRoot(props: { unitEngine: UnitEngine }) {
  const uiModel = createUiModel(props.unitEngine);
  const vm = {
    parameters() {
      return uiModel.state.parameters;
    },
    currentChannel() {
      return uiModel.state.currentChannel;
    },
    ...uiModel.actions,
  };
  return (
    <div class="flex-c gap-4 border border-[#aaa] p-4">
      <div class="flex-v gap-4">
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
          <Button
            text="ch0"
            active={vm.currentChannel() === 0}
            onClick={() => vm.selectChannel(0)}
          />
          <Button
            text="ch1"
            active={vm.currentChannel() === 1}
            onClick={() => vm.selectChannel(1)}
          />
          <HoldableButton
            text="note C"
            onDown={() => vm.noteOn(0, 60)}
            onUp={() => vm.noteOff(0, 60)}
          />
          <HoldableButton
            text="note C"
            onDown={() => vm.noteOn(1, 60)}
            onUp={() => vm.noteOff(1, 60)}
          />
        </div>
        <div class="flex-h gap-1">
          <HoldableButton
            text="ch0 note C"
            onDown={() => vm.noteOn(0, 60)}
            onUp={() => vm.noteOff(0, 60)}
          />
          <HoldableButton
            text="ch1 note C"
            onDown={() => vm.noteOn(1, 60)}
            onUp={() => vm.noteOff(1, 60)}
          />
        </div>
      </div>
    </div>
  );
}
