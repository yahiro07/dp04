import {
  createWorkletNodeWrapper,
  WorkletNodeWrapper,
} from "@my/lib/mo-music-app/worklet-node-wrapper";
import { KickParameterKey } from "@/base/parameters";
import {
  WorkletInputMessage,
  WorkletOutputMessage,
} from "@/machine/worklet-types";
import workletUrl from "./worklet.ts?worker&url";

export type UnitEngineCommand =
  | { type: "playTone"; ch: number }
  | {
      type: "setParameter";
      ch: number;
      paramKey: KickParameterKey;
      value: number | boolean;
    };

export type UnitEngine = {
  initialize(audioContext: AudioContext): Promise<AudioNode>;
  resumeIfNeed(): Promise<void>;
  handleCommand(command: UnitEngineCommand): void;
};

export function createUnitEngine(): UnitEngine {
  type MyWorkletNodeWrapper = WorkletNodeWrapper<
    WorkletInputMessage,
    WorkletOutputMessage
  >;
  let nodeWrapper: MyWorkletNodeWrapper;
  return {
    async initialize(audioContext) {
      nodeWrapper = createWorkletNodeWrapper(audioContext, workletUrl);
      await nodeWrapper.initialize();
      return nodeWrapper.outputNode;
    },
    async resumeIfNeed() {
      await nodeWrapper.resumeIfNeed();
    },
    handleCommand(command) {
      nodeWrapper.sendMessage(command);
    },
  };
}
