import {
  createWorkletNodeWrapper,
  WorkletNodeWrapper,
} from "@my/lib/mo-music-app/worklet-node-wrapper";
import { KickParameterKey } from "../base/parameters";
import { DrumKitToneId } from "../base/types";
import workletUrl from "./worklet.ts?worker&url";
import { WorkletInputMessage, WorkletOutputMessage } from "./worklet-types";

export type UnitEngineCommand =
  | { type: "playTone"; toneId: DrumKitToneId }
  | { type: "setParameter"; paramKey: KickParameterKey; value: number };

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
