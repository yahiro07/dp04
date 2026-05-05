// reference: http://www.ari-web.com/service/soft/reverb-2.htm (japanese article)

import { seqNumbers } from "@my/lib/ax/array-utils";
import { assignTyped } from "@my/lib/ax/general-utils";
import { mixValue, power3 } from "@my/lib/ax/number-utils";
import { createDelayLineRingBuffer } from "@/dsp/delay-line-ring-buffer";

type ReverbEffect = {
  prepare(sampleRate: number): void;
  processSamples(
    buffer: Float32Array,
    length: number,
    prTime: number, //0~1
    prMix: number, //0~1
  ): void;
};

type CombFilter = {
  apply(x: number, step: number, fbGain: number): number;
};
type AllPassFilter = {
  apply(x: number, step: number, fbGain: number): number;
};

function createCombFilter(bufferSize: number): CombFilter {
  const delayLine = createDelayLineRingBuffer();
  delayLine.ensureSize(bufferSize);
  return {
    apply(x: number, step: number, fbGain: number) {
      const y = delayLine.take(step);
      const x1 = x - fbGain * y;
      delayLine.push(x1);
      return y;
    },
  };
}

function createAllPassFilter(bufferSize: number): AllPassFilter {
  const delayLine = createDelayLineRingBuffer();
  delayLine.ensureSize(bufferSize);
  return {
    apply(x: number, step: number, fbGain: number) {
      const x2 = delayLine.take(step);
      const x1 = x + fbGain * x2;
      const y = x2 - fbGain * x1;
      delayLine.push(x1);
      return y;
    },
  };
}

function msToNSamples(ms: number, sampleRate: number) {
  return (ms / 1000) * sampleRate;
}

function calcFeedbackGain(stepMs: number, msRt60: number) {
  return 10 ** ((-3 * stepMs) / msRt60);
}

type ReverbState = {
  sampleRate: number;
  combs: CombFilter[];
  combStepMsSources: number[];
  combSteps: number[];
  apfs: AllPassFilter[];
  apfStepMsSources: number[];
  apfSteps: number[];
};

function reverb_create(): ReverbState {
  return {
    sampleRate: 0,
    combs: [],
    combStepMsSources: [],
    combSteps: [],
    apfs: [],
    apfStepMsSources: [],
    apfSteps: [],
  };
}

function reverb_prepare(self: ReverbState, sampleRate: number) {
  if (self.sampleRate !== sampleRate && sampleRate > 0) {
    const stepMsToNumSteps = (ms: number) => msToNSamples(ms, sampleRate);

    const combs = seqNumbers(4).map(() => createCombFilter(8192));
    const apfs = seqNumbers(2).map(() => createAllPassFilter(8192));

    const combStepMsSources = [39.85, 33.27, 36.1, 30.15];
    const combSteps = combStepMsSources.map(stepMsToNumSteps);

    const apfStepMsSources = [5, 1.7];
    const apfSteps = apfStepMsSources.map(stepMsToNumSteps);

    assignTyped(self, {
      combs,
      combStepMsSources,
      combSteps,
      apfs,
      apfStepMsSources,
      apfSteps,
      sampleRate,
    });
  }
}

function reverb_process(
  self: ReverbState,
  buffer: Float32Array,
  length: number,
  prTime: number,
  prMix: number,
) {
  const {
    sampleRate,
    combs,
    combStepMsSources,
    combSteps,
    apfs,
    apfStepMsSources,
    apfSteps,
  } = self;
  if (sampleRate === 0) return;

  const msRt60 = power3(prTime) * 2000;
  const combFbGains = combStepMsSources.map((stepMs) =>
    calcFeedbackGain(stepMs, msRt60),
  );
  const apfFbGains = apfStepMsSources.map((stepMs) =>
    calcFeedbackGain(stepMs, msRt60),
  );
  for (let i = 0; i < length; i++) {
    const x = buffer[i];
    let y = 0;
    for (let k = 0; k < 4; k++) {
      y += combs[k].apply(x, combSteps[k], combFbGains[k]) / 4;
    }
    for (let k = 0; k < 2; k++) {
      y = apfs[k].apply(y, apfSteps[k], apfFbGains[k]);
    }
    buffer[i] = mixValue(x, y, prMix);
  }
}

export function createReverbSchroeder(): ReverbEffect {
  const reverb = reverb_create();
  return {
    prepare(sampleRate) {
      reverb_prepare(reverb, sampleRate);
    },
    processSamples(buffer, length, prTime, prMix) {
      reverb_process(reverb, buffer, length, prTime, prMix);
    },
  };
}
