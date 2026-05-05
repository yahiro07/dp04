import {
  clampValue,
  mapUnaryFrom,
  mapUnaryTo,
  power2,
} from "@my/lib/ax/number-utils";
import { curveMapper, mapInvExpCurve } from "@my/lib/mo-dsp/curves";

export function calculateShortAttackEgLevel(gateOnUptime: number): number {
  // slow attack after noteOn (0→1）
  const timeMaxMs = 2;
  const timeMaxSec = timeMaxMs / 1000;
  if (gateOnUptime < timeMaxSec) {
    const t = clampValue(gateOnUptime / timeMaxSec, 0, 1);
    return curveMapper.riseInvCosine(t);
  }
  return 1;
}

function mapEgSegmentCurve(u: number, v0: number, v1: number, c: number) {
  const scaler = 1 + power2(c) * 32;
  return mapUnaryTo(mapInvExpCurve(u, scaler), v0, v1);
}

export function getEnvelopeLevelADSR(
  t: number,
  egParams: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  },
  egConfig: {
    attackMaxSec: number;
    decayMaxSec: number;
    releaseMaxSec: number;
  },
  mode: "gateOn" | "gateOff",
  levelAtGateOff: number,
) {
  const attack = power2(egParams.attack) * egConfig.attackMaxSec;
  const decay = power2(egParams.decay) * egConfig.decayMaxSec;
  const sustain = egParams.sustain;
  const release = power2(egParams.release) * egConfig.releaseMaxSec;
  const curveParam = 0.5;

  if (mode === "gateOn") {
    if (t < attack) {
      const u = t / attack;
      return mapEgSegmentCurve(u, 0, 1, curveParam);
    } else if (t < attack + decay) {
      const u = mapUnaryFrom(t, attack, attack + decay);
      return mapEgSegmentCurve(u, 1, sustain, curveParam);
    } else {
      return sustain;
    }
  } else {
    if (t < release) {
      const u = t / release;
      return mapEgSegmentCurve(u, levelAtGateOff, 0, curveParam);
    }
  }
  return 0;
}
