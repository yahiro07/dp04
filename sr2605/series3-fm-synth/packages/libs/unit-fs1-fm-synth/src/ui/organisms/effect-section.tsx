import { CommonParameterKey, CommonParameters } from "@/base/parameters";
import { FeKnob } from "@/ui/components/knob";
import { FeToggleBox } from "@/ui/components/toggle-box";

export function EffectSection(props: {
  parameters: CommonParameters;
  setParameter: (name: CommonParameterKey, value: number | boolean) => void;
}) {
  return (
    <div class="flex-v gap-1">
      <div class="flex-ha gap-4">
        <FeToggleBox
          label="DELAY"
          checked={props.parameters.delayEnabled}
          onChange={(v) => props.setParameter("delayEnabled", v)}
        />
        <FeKnob
          label="TIME"
          value={props.parameters.delayTime}
          onChange={(v) => props.setParameter("delayTime", v)}
        />
        <FeKnob
          label="FEED"
          value={props.parameters.delayFeed}
          onChange={(v) => props.setParameter("delayFeed", v)}
        />
        <FeKnob
          label="MIX"
          value={props.parameters.delayMix}
          onChange={(v) => props.setParameter("delayMix", v)}
        />
      </div>
      <div class="flex-ha gap-4">
        <FeToggleBox
          label="REVERB"
          checked={props.parameters.reverbEnabled}
          onChange={(v) => props.setParameter("reverbEnabled", v)}
        />
        <FeKnob
          label="TIME"
          value={props.parameters.reverbTime}
          onChange={(v) => props.setParameter("reverbTime", v)}
        />
        <FeKnob
          label="MIX"
          value={props.parameters.reverbMix}
          onChange={(v) => props.setParameter("reverbMix", v)}
        />
      </div>
    </div>
  );
}
