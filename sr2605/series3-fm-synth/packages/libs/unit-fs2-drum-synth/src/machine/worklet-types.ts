import { KickParameterKey } from "../base/parameters";

export type WorkletInputMessage =
  | {
      type: "setParameter";
      paramKey: KickParameterKey;
      value: number | boolean;
    }
  | { type: "playTone" }
  | { type: "stopTone" };
export type WorkletOutputMessage = { type: "dummy" };
