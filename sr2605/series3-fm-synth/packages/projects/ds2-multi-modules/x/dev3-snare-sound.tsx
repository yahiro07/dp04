/* @refresh reload */

import { mapUnaryTo, power3 } from "@my/lib/ax/number-utils";
import { mountAppRoot } from "@my/lib/ax-solid/mount-app-root";
import { createStoreMutations } from "@my/lib/ax-solid/store-mutations";
import { midiToFrequency } from "@my/lib/mo-dsp/synthesis-helper";
import { setupMidiKeyboardInput } from "@my/lib/mo-music-app/midi-keyboard-input";
import { createScriptProcessorSoundEngine } from "@my/lib/mo-music-app/script-processor-engine";
import { HoldableButton } from "@my/lib/mo-solid/components/holdable-button";
import { FeKnob, Knob } from "@my/lib/mo-solid/synth-components";
import { createMemo } from "solid-js";
import { createStore } from "solid-js/store";

const soundEngine = createScriptProcessorSoundEngine();

type EgParams = {
  hold: number;
  decay: number;
  curve: number;
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

type PlainParameterKey =
  | "oscShape"
  | "oscPitch"
  | "oscVolume"
  | "noiseVolume"
  | "ampDrive";

type EgKey =
  | "oscShapeEg"
  | "oscPitchEg"
  | "oscVolumeEg"
  | "noiseVolumeEg"
  | "ampDriveEg";

type EgFieldKey = "hold" | "decay" | "curve" | "amount";

function createDefaultUnitParameters(): UnitParameters {
  const defaultEgParams: EgParams = {
    hold: 0,
    decay: 0.5,
    curve: 0.5,
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

function EgShapeGraph(props: { egKey: EgKey }) {
  const { parameters } = uiModel;
  const pathD = createMemo(() => {
    const eg = parameters[props.egKey];
    const p0x = 0;
    const p0y = 1;
    const p1x = eg.hold * 1;
    const p1y = 1;

    let p2x = p1x + power3(eg.decay) * 50;
    let p2y = 0;
    if (eg.decay === 1) {
      p2x = 4;
      p2y = 1;
    }
    const points = [
      { x: 0, y: 0 },
      { x: p0x, y: p0y },
      { x: p1x, y: p1y },
      { x: p2x, y: p2y },
      { x: 4, y: 0 },
    ];
    const lineSegs = points.map((p, i) => {
      const x = (p.x * 200) / 4;
      const y = (1 - p.y) * 50;
      const op = i === 0 ? "M" : "L";
      return `${op}${x},${y}`;
    });
    return `${lineSegs.join(" ")} Z`;
  });

  return (
    <div class="w-[200px] h-[50px] border border-[#888] overflow-hidden">
      <svg width="200" height="50">
        <path d={pathD()} fill="#08f4" stroke="#08f" stroke-width="1" />
      </svg>
    </div>
  );
}

function EgEditKnobs(props: { egKey: EgKey }) {
  return (
    <div class="flex-ha gap-4">
      <FeKnob
        label="hold"
        value={uiModel.parameters[props.egKey].hold}
        onChange={(v) => uiModel.setEgParameter(props.egKey, "hold", v)}
      />
      <FeKnob
        label="decay"
        value={uiModel.parameters[props.egKey].decay}
        onChange={(v) => uiModel.setEgParameter(props.egKey, "decay", v)}
      />
      <FeKnob
        label="curve"
        value={uiModel.parameters[props.egKey].curve}
        onChange={(v) => uiModel.setEgParameter(props.egKey, "curve", v)}
      />
      <FeKnob
        label="amount"
        value={uiModel.parameters[props.egKey].amount}
        onChange={(v) => uiModel.setEgParameter(props.egKey, "amount", v)}
      />
    </div>
  );
}

function ParameterWithEgRow(props: {
  label: string;
  paramKey: PlainParameterKey;
  egKey: EgKey;
}) {
  return (
    <div class="flex-ha gap-2">
      <h3 class={"min-w-[100px]"}>{props.label}</h3>
      <Knob
        value={uiModel.parameters[props.paramKey]}
        onChange={(v) => uiModel.setParameter(props.paramKey, v)}
      />
      <div>|</div>
      <EgShapeGraph egKey={props.egKey} />
      <EgEditKnobs egKey={props.egKey} />
    </div>
  );
}

function ParametersPanel() {
  return (
    <div class="flex-v gap-2">
      <ParameterWithEgRow
        label="osc shape"
        paramKey="oscShape"
        egKey="oscShapeEg"
      />
      <ParameterWithEgRow
        label="osc pitch"
        paramKey="oscPitch"
        egKey="oscPitchEg"
      />
      <ParameterWithEgRow
        label="osc volume"
        paramKey="oscVolume"
        egKey="oscVolumeEg"
      />
      <ParameterWithEgRow
        label="noise volume"
        paramKey="noiseVolume"
        egKey="noiseVolumeEg"
      />
      <ParameterWithEgRow
        label="amp drive"
        paramKey="ampDrive"
        egKey="ampDriveEg"
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
