/* @refresh reload */

import { iife } from "@my/lib/ax/general-utils";
import { mapUnaryTo } from "@my/lib/ax/number-utils";
import { mountAppRoot } from "@my/lib/ax-solid/mount-app-root";
import { createStoreMutations } from "@my/lib/ax-solid/store-mutations";
import { midiToFrequency } from "@my/lib/mo-dsp/synthesis-helper";
import { setupMidiKeyboardInput } from "@my/lib/mo-music-app/midi-keyboard-input";
import { createScriptProcessorSoundEngine } from "@my/lib/mo-music-app/script-processor-engine";
import { HoldableButton } from "@my/lib/mo-solid/components/holdable-button";
import { FeKnob } from "@my/lib/mo-solid/synth-components";
import { createStore } from "solid-js/store";

const soundEngine = createScriptProcessorSoundEngine();

type UnitParameters = {
  oscPitch: number;
  oscVolume: number;
};
type UnitParameterKey = keyof UnitParameters;

const defaultUnitParameters: UnitParameters = {
  oscPitch: 0.5,
  oscVolume: 0.5,
};

const bus = {
  sampleRate: soundEngine.sampleRate,
  parameters: { ...defaultUnitParameters },
  gateOn: false,
};

let phase = 0;

function processFrame(buffer: Float32Array) {
  const sp = bus.parameters;
  const noteNumber = 48 + mapUnaryTo(sp.oscPitch, -12, 12);
  const freq = midiToFrequency(noteNumber);
  const delta = freq / bus.sampleRate;
  const gain = bus.gateOn ? sp.oscVolume : 0;
  for (let i = 0; i < buffer.length; i++) {
    phase = phase + delta;
    phase = phase - Math.floor(phase);
    // const y = Math.sin(phase * 2 * Math.PI);
    const y = (1 - phase) * 2 - 1;
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
    stopTone() {
      synthesizer.stopTone();
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
      <FeKnob
        label="volume"
        value={vm.parameters().oscVolume}
        onChange={vm.paramSetters().oscVolume}
      />
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
