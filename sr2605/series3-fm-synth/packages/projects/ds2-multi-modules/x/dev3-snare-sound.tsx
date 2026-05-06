/* @refresh reload */

import { mapUnaryTo } from "@my/lib/ax/number-utils";
import { mountAppRoot } from "@my/lib/ax-solid/mount-app-root";
import { createStoreMutations } from "@my/lib/ax-solid/store-mutations";
import { midiToFrequency } from "@my/lib/mo-dsp/synthesis-helper";
import { setupMidiKeyboardInput } from "@my/lib/mo-music-app/midi-keyboard-input";
import { createScriptProcessorSoundEngine } from "@my/lib/mo-music-app/script-processor-engine";
import { HoldableButton } from "@my/lib/mo-solid/components/holdable-button";
import { FeKnob, Knob } from "@my/lib/mo-solid/synth-components";
import { createStore } from "solid-js/store";

const soundEngine = createScriptProcessorSoundEngine();

type EgParams = {
  hold: number;
  decay1: number;
  decay2: number;
  amount: number;
};

type UnitParameters = {
  oscShape: number;
  oscPitch: number;
  oscVolume: number;
  noiseVolume: number;
  ampDrive: number;
  oscShapeEg: EgParams;
  oscPitchEg: EgParams;
  oscVolumeEg: EgParams;
  noiseVolumeEg: EgParams;
  ampDriveEg: EgParams;
};
type UnitParameterKey = keyof UnitParameters;

type EgKey =
  | "oscShapeEg"
  | "oscPitchEg"
  | "oscVolumeEg"
  | "noiseVolumeEg"
  | "ampDriveEg";

type EgFieldKey = "hold" | "decay1" | "decay2" | "amount";

function createDefaultUnitParameters(): UnitParameters {
  const defaultEgParams = {
    hold: 0,
    decay1: 0.5,
    decay2: 0.5,
    amount: 1,
  };
  return {
    oscShape: 0.5,
    oscPitch: 0.5,
    oscVolume: 0.5,
    noiseVolume: 0.5,
    ampDrive: 0.5,
    oscShapeEg: { ...defaultEgParams },
    oscVolumeEg: { ...defaultEgParams },
    oscPitchEg: { ...defaultEgParams },
    noiseVolumeEg: { ...defaultEgParams },
    ampDriveEg: { ...defaultEgParams },
  };
}

const bus = {
  sampleRate: soundEngine.sampleRate,
  parameters: createDefaultUnitParameters(),
  gateOn: false,
};

let phase = 0;

function processFrame(buffer: Float32Array) {
  const sp = bus.parameters;
  const noteNumber = 48 + mapUnaryTo(sp.oscPitch, -12, 12);
  const freq = midiToFrequency(noteNumber);
  const delta = freq / bus.sampleRate;
  const voiceGain = bus.gateOn ? 1 : 0;
  for (let i = 0; i < buffer.length; i++) {
    phase = phase + delta;
    phase = phase - Math.floor(phase);
    // const y = Math.sin(phase * 2 * Math.PI);
    let y = 0;
    y += ((1 - phase) * 2 - 1) * sp.oscVolume;
    y += (Math.random() * 2 - 1) * sp.noiseVolume;
    y *= voiceGain;
    buffer[i] = y;
  }
}

function createSynthesizer() {
  soundEngine.addProcessorFn(processFrame);
  return {
    async startOnUserAction() {
      await soundEngine.startOnUserAction();
    },
    setParameter<K extends UnitParameterKey>(
      paramKey: K,
      value: UnitParameters[K],
    ) {
      bus.parameters[paramKey] = value;
    },
    setEgParameter(egKey: EgKey, egFieldKey: EgFieldKey, value: number) {
      bus.parameters[egKey][egFieldKey] = value;
    },
    playTone() {
      bus.gateOn = true;
    },
    stopTone() {
      bus.gateOn = false;
    },
  };
}
const synthesizer = createSynthesizer();

//dsp
//---
//ui

type StoreState = {
  parameters: UnitParameters;
};
const initialState: StoreState = {
  parameters: createDefaultUnitParameters(),
};
function createUiModel() {
  const [state, setState] = createStore<StoreState>(initialState);
  const storeMutations = createStoreMutations(setState, initialState);

  const actions = {
    setParameter<K extends UnitParameterKey>(
      paramKey: K,
      value: UnitParameters[K],
    ) {
      storeMutations.setParameters((prev) => ({ ...prev, [paramKey]: value }));
      synthesizer.setParameter(paramKey, value);
    },
    setEgParameter(egKey: EgKey, egFieldKey: EgFieldKey, value: number) {
      storeMutations.setParameters((prev) => ({
        ...prev,
        [egKey]: {
          ...prev[egKey],
          [egFieldKey]: value,
        },
      }));
      synthesizer.setEgParameter(egKey, egFieldKey, value);
    },
    async playTone() {
      await synthesizer.startOnUserAction();
      synthesizer.playTone();
    },
    stopTone() {
      synthesizer.stopTone();
    },
  };
  return {
    get parameters() {
      return state.parameters;
    },
    ...actions,
  };
}
const uiModel = createUiModel();

function EgEditKnobs(props: { egKey: EgKey }) {
  return (
    <div class="flex-ha gap-4">
      <FeKnob
        label="hold"
        value={uiModel.parameters[props.egKey].hold}
        onChange={(v) => uiModel.setEgParameter(props.egKey, "hold", v)}
      />
      <FeKnob
        label="decay1"
        value={uiModel.parameters[props.egKey].decay1}
        onChange={(v) => uiModel.setEgParameter(props.egKey, "decay1", v)}
      />
      <FeKnob
        label="decay2"
        value={uiModel.parameters[props.egKey].decay2}
        onChange={(v) => uiModel.setEgParameter(props.egKey, "decay2", v)}
      />
      <FeKnob
        label="amount"
        value={uiModel.parameters[props.egKey].amount}
        onChange={(v) => uiModel.setEgParameter(props.egKey, "amount", v)}
      />
    </div>
  );
}

function ParametersPanel() {
  const h3class = "min-w-[100px]";
  return (
    <div class="flex-v gap-2">
      <div class="flex-ha gap-2">
        <h3 class={h3class}>osc shape</h3>
        <Knob
          value={uiModel.parameters.oscShape}
          onChange={(v) => uiModel.setParameter("oscShape", v)}
        />
        <div>|</div>
        <EgEditKnobs egKey="oscShapeEg" />
      </div>
      <div class="flex-ha gap-2">
        <h3 class={h3class}>osc pitch</h3>
        <Knob
          value={uiModel.parameters.oscPitch}
          onChange={(v) => uiModel.setParameter("oscPitch", v)}
        />
        <div>|</div>
        <EgEditKnobs egKey="oscPitchEg" />
      </div>
      <div class="flex-ha gap-2">
        <h3 class={h3class}>osc volume</h3>
        <Knob
          value={uiModel.parameters.oscVolume}
          onChange={(v) => uiModel.setParameter("oscVolume", v)}
        />
        <div>|</div>
        <EgEditKnobs egKey="oscVolumeEg" />
      </div>
      <div class="flex-ha gap-2">
        <h3 class={h3class}>noise volume</h3>
        <Knob
          value={uiModel.parameters.noiseVolume}
          onChange={(v) => uiModel.setParameter("noiseVolume", v)}
        />
        <div>|</div>
        <EgEditKnobs egKey="noiseVolumeEg" />
      </div>
      <div class="flex-ha gap-2">
        <h3 class={h3class}>amp drive</h3>
        <Knob
          value={uiModel.parameters.ampDrive}
          onChange={(v) => uiModel.setParameter("ampDrive", v)}
        />
        <div>|</div>
        <EgEditKnobs egKey="ampDriveEg" />
      </div>
    </div>
  );
}

function MainUi() {
  return (
    <div class="w-dvw h-dvh p-2 flex-vc gap-4">
      <ParametersPanel />
      <HoldableButton
        text="play"
        onDown={uiModel.playTone}
        onUp={uiModel.stopTone}
      />
    </div>
  );
}

function App() {
  setupMidiKeyboardInput({
    noteCallback(_noteNumber, velocity) {
      if (velocity > 0) {
        uiModel.playTone();
      } else {
        uiModel.stopTone();
      }
    },
  });
  return <MainUi />;
}

mountAppRoot(() => <App />);
