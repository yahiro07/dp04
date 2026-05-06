/* @refresh reload */

import { iife } from "@my/lib/ax/general-utils";
import { mountAppRoot } from "@my/lib/ax-solid/mount-app-root";
import { createStoreMutations } from "@my/lib/ax-solid/store-mutations";
import { createScriptProcessorSoundEngine } from "@my/lib/mo-music-app/script-processor-engine";
import { Button } from "@my/lib/mo-solid/components/button";
import { FeKnob } from "@my/lib/mo-solid/synth-components";
import { createStore } from "solid-js/store";

const soundEngine = createScriptProcessorSoundEngine();

type UnitParameters = {
  oscPitch: number;
};
type UnitParameterKey = keyof UnitParameters;

const defaultUnitParameters: UnitParameters = {
  oscPitch: 0.5,
};

const bus = {
  sampleRate: soundEngine.sampleRate,
  parameters: { ...defaultUnitParameters },
  gateOn: false,
};

let phase = 0;

function processFrame(buffer: Float32Array) {
  const freq = 440;
  const delta = freq / bus.sampleRate;
  const gain = bus.gateOn ? 1 : 0;
  for (let i = 0; i < buffer.length; i++) {
    phase = phase + delta;
    phase = phase - Math.floor(phase);
    const y = Math.sin(phase * 2 * Math.PI);
    buffer[i] = y * gain;
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
    playTone() {
      bus.gateOn = true;
      setTimeout(() => {
        bus.gateOn = false;
      }, 1000);
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

function createUiModel() {
  const initialState: StoreState = {
    parameters: defaultUnitParameters,
  };
  const [state, setState] = createStore<StoreState>(initialState);
  const storeMutations = createStoreMutations(setState, initialState);

  const actions = {
    setParameter<K extends UnitParameterKey>(
      paramKey: K,
      value: UnitParameters[K],
    ) {
      storeMutations.setParameters((prev) => ({ ...prev, [paramKey]: value }));
      bus.parameters[paramKey] = value;
    },
    async playTone() {
      await synthesizer.startOnUserAction();
      synthesizer.playTone();
    },
  };
  return { state, ...actions };
}
const uiModel = createUiModel();

function ParametersPanel() {
  const _paramSetters = iife(() => {
    const obj = {} as {
      [K in UnitParameterKey]: (v: UnitParameters[K]) => void;
    };
    for (const _key of Object.keys(defaultUnitParameters)) {
      const key = _key as UnitParameterKey;
      obj[key] = (v: number) => uiModel.setParameter(key, v);
    }
    return obj;
  });
  const vm = {
    parameters: () => uiModel.state.parameters,
    paramSetters: () => _paramSetters,
  };
  return (
    <div>
      <FeKnob
        label="pitch"
        value={vm.parameters().oscPitch}
        onChange={vm.paramSetters().oscPitch}
      />
    </div>
  );
}

function MainUi() {
  return (
    <div class="w-dvw h-dvh p-2 flex-vc gap-4">
      <ParametersPanel />
      <Button text="play" onClick={uiModel.playTone} />
    </div>
  );
}

function App() {
  return <MainUi />;
}

mountAppRoot(() => <App />);
