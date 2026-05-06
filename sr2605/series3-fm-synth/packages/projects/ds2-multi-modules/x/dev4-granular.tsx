/* @refresh reload */

import { m_sin, m_two_pi } from "@my/lib/ax/math-utils";
import { linearInterpolate, randomBipolar } from "@my/lib/ax/number-utils";
import { mountAppRoot } from "@my/lib/ax-solid/mount-app-root";
import { createStoreMutations } from "@my/lib/ax-solid/store-mutations";
import { applySoftClip } from "@my/lib/mo-dsp/soft-clip-shaper";
import { midiToFrequency } from "@my/lib/mo-dsp/synthesis-helper";
import { setupMidiKeyboardInput } from "@my/lib/mo-music-app/midi-keyboard-input";
import { HoldableButton } from "@my/lib/mo-solid/components/holdable-button";
import { FeKnob } from "@my/lib/mo-solid/synth-components";
import { createStore } from "solid-js/store";

type UnitParameters = {
  basePitch: number;
};

type UnitParameterKey = keyof UnitParameters;

function createDefaultUnitParameters() {
  return {
    basePitch: 0.5,
  };
}

const bus = {
  parameters: createDefaultUnitParameters(),
};

function createSynthesizer() {
  const audioContext = new AudioContext();
  return {
    setParameter<K extends UnitParameterKey>(
      paramKey: K,
      value: UnitParameters[K],
    ) {
      bus.parameters[paramKey] = value;
    },
    async playTone(noteNumber: number) {
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
      const { sampleRate } = audioContext;
      const audioBuffer = audioContext.createBuffer(
        1,
        sampleRate * 0.5,
        sampleRate,
      );
      const buffer = audioBuffer.getChannelData(0);

      const modNoteNumber = linearInterpolate(
        noteNumber,
        48,
        80,
        36,
        140,
        true,
      );

      const baseFreq = midiToFrequency(modNoteNumber);
      console.log(baseFreq);
      const grainDur = sampleRate / baseFreq;

      function placeGrain(inputOffset: number) {
        const offset = inputOffset >>> 0;
        for (let i = 0; i < grainDur; i++) {
          const pp = i / grainDur;
          let y = m_sin(pp * m_two_pi) * 0.5;
          // if (pp > 0.5) y = 0;
          buffer[offset + i] += y;
        }
      }

      let pos = 0;
      for (let i = 0; i < buffer.length; i++) {
        // placeGrain(pos);
        const jitter = randomBipolar() * grainDur * 0.1;
        placeGrain(pos + jitter);
        pos += grainDur;
      }

      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = applySoftClip(buffer[i]);
      }

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
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
    async playTone(noteNumber: number) {
      console.log(noteNumber);
      synthesizer.playTone(noteNumber);
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

function MainUi() {
  return (
    <div class="w-dvw h-dvh p-2 flex-vc gap-4">
      <FeKnob
        label="bp"
        value={uiModel.parameters.basePitch}
        onChange={(v) => uiModel.setParameter("basePitch", v)}
      />
      <HoldableButton text="play" onDown={() => uiModel.playTone(60)} />
    </div>
  );
}

function App() {
  setupMidiKeyboardInput({
    noteCallback(noteNumber, velocity) {
      if (velocity > 0) {
        uiModel.playTone(noteNumber);
      }
    },
  });
  return <MainUi />;
}

mountAppRoot(() => <App />);
