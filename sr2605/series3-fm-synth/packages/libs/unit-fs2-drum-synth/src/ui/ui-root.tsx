import { iife } from "@my/lib/ax/general-utils";
import { Button } from "@my/lib/mo-solid/components/button";
import {
  FeKnob,
  FeSelectorBox,
  FeToggleBox,
} from "@my/lib/mo-solid/synth-components";
import { UnitWaveScope } from "@my/lib/mo-solid/synth-components/unit-wave-scope";
import { createEffect } from "solid-js";
import {
  KickEgWaveOptions,
  KickParameterKey,
  KickParametersSuit,
} from "@/base/parameters";
import { kickSynthExports_getEgWaveCurveFunction } from "@/dsp/kick-synthesizer-dsp";
import { UnitEngine } from "@/machine/unit-engine";
import { createUiModel } from "@/ui/ui-model";

export function UiRoot(props: {
  unitEngine: UnitEngine;
  currentChannel: number;
}) {
  const uiModel = createUiModel(props.unitEngine);

  createEffect(() => {
    uiModel.setCurrentChannel(props.currentChannel);
  });

  const _paramSetters = iife(() => {
    const obj = {} as {
      [K in KickParameterKey]: (v: KickParametersSuit[K]) => void;
    };
    for (const _key of Object.keys(uiModel.state.parameters)) {
      const key = _key as KickParameterKey;
      obj[key] = (v: number | boolean) => uiModel.setParameter(key, v);
    }
    return obj;
  });

  const vm = {
    parameters() {
      return uiModel.state.parameters;
    },
    setParameter(key: KickParameterKey, value: number) {
      uiModel.setParameter(key, value);
    },
    paramSetters() {
      return _paramSetters;
    },
    playTone() {
      uiModel.playTone();
    },
  };
  const headerClass = "min-w-[50px]";
  return (
    <div class="flex-v border border-[#aaa] p-4">
      <div>fs2 drum synth {props.currentChannel}</div>
      <div>
        <div class="flex-ha gap-2">
          <Button text="tone" onClick={() => vm.playTone()} />
          <Button text="dump" onClick={uiModel.dumpParameters} />
        </div>
        <div class="flex-ha gap-2">
          <h3 class={headerClass}>Wave</h3>
          <FeKnob
            label="shape"
            value={vm.parameters().oscShape}
            onChange={vm.paramSetters().oscShape}
          />
          <FeToggleBox
            label="osc on"
            checked={vm.parameters().oscOn}
            onChange={vm.paramSetters().oscOn}
          />
          <FeToggleBox
            label="noise on"
            checked={vm.parameters().noiseOn}
            onChange={vm.paramSetters().noiseOn}
          />
        </div>
        <div class="flex-ha gap-2">
          <h3 class={headerClass}>pitch</h3>
          <FeKnob
            label="pitch"
            value={vm.parameters().oscPitch}
            onChange={vm.paramSetters().oscPitch}
          />
          <div>|</div>
          <UnitWaveScope
            waveFn={kickSynthExports_getEgWaveCurveFunction(
              vm.parameters().pitchEgWave,
            )}
            shape={vm.parameters().pitchEgShape}
          />
          <FeSelectorBox
            label="type"
            options={KickEgWaveOptions}
            value={vm.parameters().pitchEgWave}
            onChange={vm.paramSetters().pitchEgWave}
          />
          <FeKnob
            label="curve"
            value={vm.parameters().pitchEgShape}
            onChange={vm.paramSetters().pitchEgShape}
          />
          <FeKnob
            label="time"
            value={vm.parameters().pitchEgTime}
            onChange={vm.paramSetters().pitchEgTime}
          />
          <FeKnob
            label="amount"
            value={vm.parameters().pitchEgAmount}
            onChange={vm.paramSetters().pitchEgAmount}
          />
        </div>
        <div class="flex-ha gap-2">
          <h3 class={headerClass}>amp</h3>
          <UnitWaveScope
            waveFn={kickSynthExports_getEgWaveCurveFunction(
              vm.parameters().ampEgWave,
            )}
            shape={vm.parameters().ampEgShape}
          />
          <FeSelectorBox
            label="type"
            options={KickEgWaveOptions}
            value={vm.parameters().ampEgWave}
            onChange={vm.paramSetters().ampEgWave}
          />
          <FeKnob
            label="curve"
            value={vm.parameters().ampEgShape}
            onChange={vm.paramSetters().ampEgShape}
          />
          <FeKnob
            label="time"
            value={vm.parameters().ampEgTime}
            onChange={vm.paramSetters().ampEgTime}
          />
          <div>|</div>
          <FeKnob
            label="drive"
            value={vm.parameters().ampDrive}
            onChange={vm.paramSetters().ampDrive}
          />
          <FeKnob
            label="volume"
            value={vm.parameters().volume}
            onChange={vm.paramSetters().volume}
          />
        </div>
      </div>
      <div class="flex-ha gap-2">
        <h3 class={headerClass}>noise</h3>
        <UnitWaveScope
          waveFn={kickSynthExports_getEgWaveCurveFunction(
            vm.parameters().noiseEgWave,
          )}
          shape={vm.parameters().noiseEgShape}
        />
        <FeSelectorBox
          label="type"
          options={KickEgWaveOptions}
          value={vm.parameters().noiseEgWave}
          onChange={vm.paramSetters().noiseEgWave}
        />
        <FeKnob
          label="curve"
          value={vm.parameters().noiseEgShape}
          onChange={vm.paramSetters().noiseEgShape}
        />
        <FeKnob
          label="time"
          value={vm.parameters().noiseEgTime}
          onChange={vm.paramSetters().noiseEgTime}
        />
        <div>|</div>
        <FeKnob
          label="volume"
          value={vm.parameters().noiseVolume}
          onChange={vm.paramSetters().noiseVolume}
        />
      </div>
    </div>
  );
}
