import {
  createWorkletNodeWrapper,
  WorkletNodeWrapper,
} from "@my/lib/mo-music-app/worklet-node-wrapper";
import { RootMachineCommand, Scene } from "@/base/types";
import { createDefaultScene } from "@/machine/default-scene";
import {
  WorkletInputMessage,
  WorkletOutputMessage,
} from "@/machine/worklet-types";
import workletUrl from "./worklet.ts?worker&url";

export type RootMachine = {
  initialize(audioContext: AudioContext): Promise<AudioNode>;
  resumeIfNeed(): Promise<void>;
  getSceneState(): Scene;
  handleCommand(command: RootMachineCommand): void;
};

export function createRootMachine(): RootMachine {
  type MyWorkletNodeWrapper = WorkletNodeWrapper<
    WorkletInputMessage,
    WorkletOutputMessage
  >;
  const initialScene = createDefaultScene();
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
    getSceneState() {
      return initialScene;
    },
    handleCommand(command) {
      nodeWrapper.sendMessage(command);
    },
  };
}
export const rootMachine = createRootMachine();
