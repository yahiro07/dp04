import {
  FeKnob,
  FeNumberSliderBox,
  FeSelectorBox,
  FeToggleBox,
} from "@my/lib/mo-solid/synth-components";
import { Show } from "solid-js";
import {
  OperatorParameterKey,
  OperatorParameters,
  operatorWaveformOptions,
} from "@/base/parameters";

export function OperatorEditor(props: {
  isCarrier: boolean;
  parameters: OperatorParameters;
  setParameter: (name: OperatorParameterKey, value: number | boolean) => void;
}) {
  return (
    <div class="flex-v gap-4">
      <div class="flex-ha gap-4">
        <FeNumberSliderBox
          label="OCT"
          value={props.parameters.octave}
          onChange={(v) => props.setParameter("octave", v)}
          min={-3}
          max={3}
          step={1}
          fracDigits={0}
        />
        <FeNumberSliderBox
          label="SEMI"
          value={props.parameters.semi}
          onChange={(v) => props.setParameter("semi", v)}
          min={-12}
          max={12}
          step={1}
          fracDigits={0}
        />
        <FeNumberSliderBox
          label="RATIO"
          value={props.parameters.ratio}
          onChange={(v) => props.setParameter("ratio", v)}
          min={1}
          max={15}
          step={1}
          fracDigits={0}
        />
        <FeKnob
          label="FINE"
          value={props.parameters.fine}
          onChange={(v) => props.setParameter("fine", v)}
          min={-1}
          max={1}
        />
        <FeKnob
          label="FB"
          value={props.parameters.feedback}
          onChange={(v) => props.setParameter("feedback", v)}
        />
        <FeToggleBox
          label="ON"
          checked={props.parameters.active}
          onChange={(v) => props.setParameter("active", v)}
        />
      </div>
      <div class="flex-ha gap-4">
        <FeKnob
          label="A"
          value={props.parameters.attack}
          onChange={(v) => props.setParameter("attack", v)}
        />
        <FeKnob
          label="D"
          value={props.parameters.decay}
          onChange={(v) => props.setParameter("decay", v)}
        />
        <FeKnob
          label="S"
          value={props.parameters.sustain}
          onChange={(v) => props.setParameter("sustain", v)}
        />
        <FeKnob
          label="R"
          value={props.parameters.release}
          onChange={(v) => props.setParameter("release", v)}
        />
        <FeKnob
          label="LEVEL"
          value={props.parameters.level}
          onChange={(v) => props.setParameter("level", v)}
        />
      </div>
      <div class="flex-ha gap-4">
        <FeSelectorBox
          label="WAVE"
          options={operatorWaveformOptions}
          value={props.parameters.wave}
          onChange={(v) => props.setParameter("wave", v)}
        />
        <FeKnob
          label="SHAPE"
          value={props.parameters.shape}
          onChange={(v) => props.setParameter("shape", v)}
        />
        <Show when={props.isCarrier}>
          <div class="flex-ha gap-4">
            <FeToggleBox
              label="UNISON"
              checked={props.parameters.unisonOn}
              onChange={(v) => props.setParameter("unisonOn", v)}
            />
            <FeNumberSliderBox
              label="NUM"
              value={props.parameters.unisonNum}
              onChange={(v) => props.setParameter("unisonNum", v)}
              min={1}
              max={7}
              step={1}
              fracDigits={0}
            />
            <FeKnob
              label="DETUNE"
              value={props.parameters.unisonDetune}
              onChange={(v) => props.setParameter("unisonDetune", v)}
            />
            {/* <FeKnob
          label="MIX"
          value={props.parameters.unisonMix}
          onChange={(v) => props.setParameter("unisonMix", v)}
        />
        <FeToggleBox
          label="RND_PH"
          checked={props.parameters.unisonRndPhase}
          onChange={(v) => props.setParameter("unisonRndPhase", v)}
        /> */}
          </div>
        </Show>
      </div>
    </div>
  );
}
