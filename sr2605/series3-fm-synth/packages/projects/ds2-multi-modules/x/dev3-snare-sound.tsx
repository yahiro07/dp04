/* @refresh reload */

import { seqNumbers } from "@my/lib/ax/array-utils";
import { m_sin, m_two_pi } from "@my/lib/ax/math-utils";
import {
  clampValue,
  linearInterpolate,
  mapUnaryTo,
  mixValue,
  power2,
  power3,
} from "@my/lib/ax/number-utils";
import { mountAppRoot } from "@my/lib/ax-solid/mount-app-root";
import { createStoreMutations } from "@my/lib/ax-solid/store-mutations";
import { createPlainSelectorOptions } from "@my/lib/mo/selector-option";
import { calcBufferMaxLevel } from "@my/lib/mo-dsp/buffer-functions";
import { tunableSigmoid } from "@my/lib/mo-dsp/curves";
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

type OscShapeMode =
  | "fmFeed"
  | "speed"
  | "accel"
  | "sdm"
  | "ws1"
  | "ws2"
  | "ws3"
  | "ws4"
  | "ws5";

const oscShapeModeOptions = createPlainSelectorOptions([
  "fmFeed",
  "speed",
  "accel",
  "sdm",
  "ws1",
  "ws2",
  "ws3",
  "ws4",
  "ws5",
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
    decay: 1,
    curve: 0.5,
    amount: 1,
  };
  return {
    oscWave: "sine",
    oscShapeMode: "ws1",
    oscShape: 0,
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
  gateTriggered: false,
  gateOnUptime: 0,
  oscPhaseAcc: 0,
  miOscShape: createInterpolator(),
  miOscVolume: createInterpolator(),
  miNoiseVolume: createInterpolator(),
  miAmpGain: createInterpolator(),
  processingActive: false,
  egLevels: {
    oscShape: 0,
    oscPitch: 0,
    oscVolume: 0,
    noiseVolume: 0,
    ampDrive: 0,
  },
  intermediate: {
    pmxOscShape: 0,
    pmxOscPitch: 0,
    oscVolume: 0,
    noiseVolume: 0,
    ampDrive: 0,
  },
};

function getOscWaveform(wave: OscWave, phase: number) {
  switch (wave) {
    case "sine":
      return Math.sin(phase * 2 * Math.PI);
    case "triangle":
      return (1 - Math.abs(phase - 0.5) * 2) * 2 - 1;
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

function wrapBipolar<T extends unknown[]>(
  fn: (x: number, ...restArgs: T) => number,
) {
  return (_x: number, ...restArgs: T) => {
    const sign = Math.sign(_x);
    const x = Math.abs(_x);
    const y = fn(x, ...restArgs);
    return sign * y;
  };
}

const shaperCore = {
  foldSine(x: number) {
    return Math.sin(x * Math.PI * 0.5);
  },
  // foldSineHalf: wrapBipolar((_x) => {
  //   const sign = Math.sign(_x);
  //   const x = Math.abs(_x);
  //   let y = 0;
  //   if (x < 1) {
  //     y = Math.sin(x * m_half_pi);
  //   } else {
  //     y = 1 - (1 - Math.sin(x * m_half_pi) ** 2);
  //   }
  //   return sign * y;
  // }),
  foldTriangle(x: number) {
    const t = (((x + 1) % 4) + 4) % 4;
    return t < 2 ? t - 1 : 3 - t;
  },
  // foldTriangleHalf: wrapBipolar((x) => {
  //   return Math.abs(((x + 1) % 2) - 1);
  // }),
  foldSaw: wrapBipolar((x) => {
    let y = x - Math.floor(x);
    if (((x >> 0) & 1) === 1) y -= 1;
    return y;
  }),
  // foldSawHalf(x: number) {
  //   const sign = Math.sign(x);
  //   let level = Math.abs(x);
  //   level %= 1;
  //   return sign * level;
  // },
  foldPolyHalf: wrapBipolar((x) => {
    if (x < 1) return x;
    if (0) {
      return (x & 1) === 1 ? 1 : 0;
    } else {
      if (x < 2) return 1;
      return ((x / 2) & 1) === 0 ? 1 : 0;
    }
  }),
  foldBlend(x: number, a: number) {
    const f = shaperCore.foldTriangle(x);
    const s = Math.sin(x * Math.PI * 2);
    return mixValue(f, s, a);
  },
  foldCharpSine: wrapBipolar((x) => {
    const xa = x < 1 ? x : power2(1 + (x - 1) * 0.5);
    return Math.sin(xa * Math.PI * 0.5);
  }),
  drive1(x: number, a: number) {
    const k = mapUnaryTo(a, 0, -0.9);
    return tunableSigmoid(x, k);
  },
  drive2(x: number, a: number) {
    if (x < 0) return x;
    const k = mapUnaryTo(a, 0, -0.9);
    return tunableSigmoid(x, k);
  },
  drive3(x: number, a: number) {
    const gain = mapUnaryTo(power2(a), 1, 42);
    const dry = x;
    x = x * gain;
    const wet = x / (1 + Math.abs(x));
    return mixValue(dry, wet, a);
  },
  crush(x: number, a: number) {
    const step = mapUnaryTo(a, 32, 1);
    return Math.round(x * step) / step;
  },
  hardClip(x: number, a: number) {
    const g = mapUnaryTo(power2(a), 1, 20);
    x *= g;
    return Math.max(-1, Math.min(1, x));
  },
  softAtan(x: number, a: number) {
    const g = mapUnaryTo(power2(a), 1, 30);
    const k = (2 / Math.PI) * Math.atan(x * g);
    return k;
  },
  softTanh(x: number, a: number) {
    const g = mapUnaryTo(power2(a), 1, 25);
    const y = Math.tanh(x * g);
    return y;
  },
  diode(x: number, a: number) {
    const g = mapUnaryTo(power2(a), 1, 40);
    x *= g;
    const p = Math.max(0, x);
    const n = Math.min(0, x);
    const y = p / (1 + p) + (n / (1 + Math.abs(n))) * 0.4;
    return Math.max(-1, Math.min(1, y));
  },
  asymClip(x: number, a: number) {
    const g = mapUnaryTo(power2(a), 1, 30);
    x *= g;
    const pos = 0.6;
    const neg = 1.0;
    const y = x >= 0 ? Math.min(x, pos) : Math.max(x, -neg);
    return y;
  },
  fuzzPow(x: number, a: number) {
    const g = mapUnaryTo(power2(a), 1, 60);
    x *= g;
    const s = Math.sign(x);
    const ax = Math.min(1, Math.abs(x));
    const p = mapUnaryTo(a, 0.7, 0.2);
    return s * Math.pow(ax, p);
  },
};

function applyShaper(x: number, shaperMode: OscShapeMode, prLevel: number) {
  const prLevel3 = power3(prLevel);
  const y = x * (1 + prLevel3 * 1000);
  if (shaperMode === "ws1") {
    return shaperCore.foldSine(y);
  } else if (shaperMode === "ws2") {
    const y = x * (1 + prLevel3 * 70);
    return shaperCore.foldSaw(y);
  } else if (shaperMode === "ws3") {
    const y = x * (1 + prLevel3 * 70);
    return shaperCore.foldCharpSine(y);
  } else if (shaperMode === "ws4") {
    return shaperCore.foldBlend(y, prLevel);
  } else if (shaperMode === "ws5") {
    return shaperCore.foldTriangle(y);
  }
  return x;
}

function processOsc(buffer: Float32Array, len: number) {
  const sp = bus.parameters;
  const noteNumber =
    bus.noteNumber + mapUnaryTo(bus.intermediate.pmxOscPitch, -24, 24);
  const freq = midiToFrequency(noteNumber);
  const delta = freq / bus.sampleRate;

  bus.miOscShape.feed(bus.intermediate.pmxOscShape, len, bus.gateTriggered);
  bus.miOscVolume.feed(bus.intermediate.oscVolume, len, bus.gateTriggered);

  for (let i = 0; i < buffer.length; i++) {
    const shape = bus.miOscShape.advance();
    const volume = bus.miOscVolume.advance();
    bus.oscPhaseAcc += delta;
    bus.oscPhaseAcc -= Math.floor(bus.oscPhaseAcc);
    let phase = bus.oscPhaseAcc;
    phase = applyPhaseModifier(phase, sp.oscShapeMode, shape);
    phase -= Math.floor(phase);
    let y = getOscWaveform(sp.oscWave, phase);
    y = applyShaper(y, sp.oscShapeMode, shape);
    y = clampValue(y, -1, 1);
    buffer[i] += y * volume;
  }
}

function processNoiseOsc(buffer: Float32Array, len: number) {
  bus.miNoiseVolume.feed(bus.intermediate.noiseVolume, len, bus.gateTriggered);
  for (let i = 0; i < len; i++) {
    const volume = bus.miNoiseVolume.advance();
    const y = (Math.random() * 2 - 1) * volume;
    buffer[i] += y;
  }
}

function calcEgLevel(egParams: EgParams): number {
  const decay = egParams.decay;
  const maxT = 2;
  if (decay === 1) {
    return bus.gateOn ? 1 : 0;
  } else {
    const decayT = Math.max(power2(decay) * maxT, 0.001);
    return linearInterpolate(bus.gateOnUptime, 0, decayT, 1, 0, true);
  }
}

function updateEgs() {
  bus.egLevels.oscShape = calcEgLevel(bus.parameters.oscShapeEg);
  bus.egLevels.oscPitch = calcEgLevel(bus.parameters.oscPitchEg);
  bus.egLevels.oscVolume = calcEgLevel(bus.parameters.oscVolumeEg);
  bus.egLevels.noiseVolume = calcEgLevel(bus.parameters.noiseVolumeEg);
  bus.egLevels.ampDrive = calcEgLevel(bus.parameters.ampDriveEg);

  {
    const hi = bus.parameters.oscShape;
    const lo = bus.parameters.oscShape * (1 - bus.parameters.oscShapeEg.amount);
    bus.intermediate.pmxOscShape = mapUnaryTo(bus.egLevels.oscShape, lo, hi);
  }
  {
    const hi = bus.parameters.oscPitch;
    const lo = bus.parameters.oscPitch - bus.parameters.oscPitchEg.amount; //could be negative
    bus.intermediate.pmxOscPitch = mapUnaryTo(bus.egLevels.oscPitch, lo, hi);
  }
  bus.intermediate.oscVolume =
    bus.egLevels.oscVolume * bus.parameters.oscVolume;
  bus.intermediate.noiseVolume =
    bus.egLevels.noiseVolume * bus.parameters.noiseVolume;

  if (bus.gateOn && 0) {
    console.log(bus.egLevels.oscPitch, bus.intermediate.pmxOscPitch);
  }
}

function createSynthesizer() {
  return {
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
      bus.gateTriggered = true;
      bus.gateOnUptime = 0;
      bus.processingActive = true;
    },
    stopTone() {
      bus.gateOn = false;
    },
    processFrame(buffer: Float32Array) {
      if (!bus.processingActive) return;
      const len = buffer.length;
      updateEgs();
      buffer.fill(0);
      processOsc(buffer, len);
      processNoiseOsc(buffer, len);
      bus.gateTriggered = false;
      bus.gateOnUptime += buffer.length / bus.sampleRate;
      const maxLevel = calcBufferMaxLevel(buffer, len);
      if (maxLevel < 1e-4) {
        bus.processingActive = false;
      }
    },
  };
}
const synthesizer = createSynthesizer();
soundEngine.addProcessorFn(synthesizer.processFrame);

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
      await soundEngine.startOnUserAction();
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
