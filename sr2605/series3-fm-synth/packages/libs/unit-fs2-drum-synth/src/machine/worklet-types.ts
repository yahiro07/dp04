import { KickParameterKey, UnitParameters } from "../base/parameters";

export type WorkletInputMessage =
  | { type: "setFullParameters"; ch: number; parameters: UnitParameters }
  | {
      type: "setParameter";
      ch: number;
      paramKey: KickParameterKey;
      value: number | boolean;
    }
  | { type: "playTone"; ch: number }
  | { type: "stopTone"; ch: number };
export type WorkletOutputMessage = { type: "dummy" };
