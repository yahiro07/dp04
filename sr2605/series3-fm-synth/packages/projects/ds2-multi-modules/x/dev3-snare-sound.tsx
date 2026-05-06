/* @refresh reload */

import { seqNumbers } from "@my/lib/ax/array-utils";
import { m_sin, m_two_pi } from "@my/lib/ax/math-utils";
import { mapUnaryTo, mixValue, power2, power3 } from "@my/lib/ax/number-utils";
import { mountAppRoot } from "@my/lib/ax-solid/mount-app-root";
import { createStoreMutations } from "@my/lib/ax-solid/store-mutations";
import { createPlainSelectorOptions } from "@my/lib/mo/selector-option";
import { createInterpolator } from "@my/lib/mo-dsp/interpolator";
import { midiToFrequency } from "@my/lib/mo-dsp/synthesis-helper";
import { setupMidiKeyboardInput } from "@my/lib/mo-music-app/midi-keyboard-input";
import { createScriptProcessorSoundEngine } from "@my/lib/mo-music-app/script-processor-engine";
import { HoldableButton } from "@my/lib/mo-solid/components/holdable-button";
import { FeKnob, FeSelectorBox, Knob } from "@my/lib/mo-solid/synth-components";
import { createMemo } from "solid-js";
import { createStore } from "solid-js/store";

const soundEngine = createScriptProcessorSoundEngine();

type OscWave = "sine" | "triangle" | "square" | "sawtooth";

const oscWaveOptions = createPlainSelectorOptions([
  "sine",
  "triangle",
  "square",
  "sawtooth",
]);

type OscShapeMode = "fmFeed" | "speed" | "accel" | "sdm";

const oscShapeModeOptions = createPlainSelectorOptions([
  "fmFeed",
  "speed",
  "accel",
  "sdm",
]);

type EgParams = {
  hold: number;
  decay: number;
  curve: number;
  amount: number;
};

type UnitParameters = {
  oscWave: OscWave;
  oscShapeMode: OscShapeMode;
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
  | "oscWave"
  | "oscShapeMode"
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
    oscWave: "sine",
    oscShapeMode: "sdm",
    oscShape: 0.5,
    oscPitch: 0.5,
    oscVolume: 0.25,
    noiseVolume: 0,
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
  noteNumber: 60,
  gateOn: false,
  oscPhaseAcc: 0,
  miOscShape: createInterpolator(),
};

function getOscWaveform(wave: OscWave, phase: number) {
  switch (wave) {
    case "sine":
      return Math.sin(phase * 2 * Math.PI);
    case "triangle":
      return 1 - Math.abs(phase - 0.5) * 2;
    case "square":
      return phase < 0.5 ? 1 : -1;
    case "sawtooth":
      return phase * 2 - 1;
  }
}

const randomSequence = seqNumbers(1000).map(() => Math.random());

function applyPhaseModifier(
  phase: number,
  colorMode: OscShapeMode,
  color: number,
): number {
  const color2 = power2(color);
  const color3 = power3(color);

  if (colorMode === "fmFeed") {
    const fmOscValue = m_sin(phase * m_two_pi);
    return phase + fmOscValue * color3 * 100;
  } else if (colorMode === "speed") {
    const speedRate = 1 + color3 * 100;
    return phase * speedRate;
  } else if (colorMode === "accel") {
    const speedRate = 1 + power2(phase) * color3 * 100;
    return phase * speedRate;
  } else if (colorMode === "sdm") {
    const speedRate = mapUnaryTo(color3, 1, 1000);
    const indexF = phase * speedRate;
    const i0 = Math.floor(indexF);
    const i1 = i0 + 1;
    const m = indexF - i0;
    const y1 = phase;
    const y2 = mixValue(
      i0 === 0 ? 0 : randomSequence[i0],
      randomSequence[i1],
      m,
    );
    const y3 = mixValue(y1, y2, color);
    return y3;
  } else {
    return phase;
  }
}

function processOsc(buffer: Float32Array) {
  const len = buffer.length;
  const sp = bus.parameters;
  const noteNumber = bus.noteNumber + mapUnaryTo(sp.oscPitch, -24, 24);
  const freq = midiToFrequency(noteNumber);
  const delta = freq / bus.sampleRate;
  bus.miOscShape.feed(sp.oscShape, len);
  for (let i = 0; i < buffer.length; i++) {
    const shape = bus.miOscShape.advance();
    bus.oscPhaseAcc += delta;
    bus.oscPhaseAcc -= Math.floor(bus.oscPhaseAcc);
    let phase = bus.oscPhaseAcc;
    phase = applyPhaseModifier(phase, sp.oscShapeMode, shape);
    phase -= Math.floor(phase);
    const y = getOscWaveform(sp.oscWave, phase) * sp.oscVolume;
    buffer[i] += y;
  }
}

function processNoiseOsc(buffer: Float32Array) {
  const sp = bus.parameters;
  for (let i = 0; i < buffer.length; i++) {
    const y = (Math.random() * 2 - 1) * sp.noiseVolume;
    buffer[i] += y;
  }
}

function processAmp(buffer: Float32Array) {
  const voiceGain = bus.gateOn ? 1 : 0;
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] *= voiceGain;
  }
}

function processFrame(buffer: Float32Array) {
  buffer.fill(0);
  processOsc(buffer);
  processNoiseOsc(buffer);
  processAmp(buffer);
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
      // console.log("setParameter", paramKey, value);
      bus.parameters[paramKey] = value;
    },
    setEgParameter(egKey: EgKey, egFieldKey: EgFieldKey, value: number) {
      bus.parameters[egKey][egFieldKey] = value;
    },
    playTone(noteNumber: number) {
      bus.noteNumber = noteNumber;
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
    async playTone(noteNumber: number) {
      await synthesizer.startOnUserAction();
      synthesizer.playTone(noteNumber);
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
        value={uiModel.parameters[props.paramKey] as number}
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
      <div class="flex-ha gap-2">
        <FeSelectorBox
          label="wave"
          options={oscWaveOptions}
          value={uiModel.parameters.oscWave}
          onChange={(v) => uiModel.setParameter("oscWave", v)}
        />
        <FeSelectorBox
          label="shape mode"
          options={oscShapeModeOptions}
          value={uiModel.parameters.oscShapeMode}
          onChange={(v) => uiModel.setParameter("oscShapeMode", v)}
        />
      </div>
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
        onDown={() => uiModel.playTone(48)}
        onUp={() => uiModel.stopTone()}
      />
    </div>
  );
}

function App() {
  setupMidiKeyboardInput({
    noteCallback(noteNumber, velocity) {
      if (velocity > 0) {
        uiModel.playTone(noteNumber);
      } else {
        uiModel.stopTone();
      }
    },
  });
  return <MainUi />;
}

mountAppRoot(() => <App />);
