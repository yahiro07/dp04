import {
  createWorkletNodeWrapper,
  WorkletNodeWrapper,
} from "@my/lib/mo-music-app/worklet-node-wrapper";
import { RootMachineCommand, Scene } from "@/base/types";
import { createDefaultScene } from "@/machine/default-scene";
import {
  WorkletInputMessage,
  WorkletOutputMessage,
  workletProcessorName,
} from "@/machine/worklet-types";
import workletUrl from "./worklet.ts?worker&url";

export type RootMachine = {
  initialize(audioContext: AudioContext): AudioNode;
  load(): Promise<void>;
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
    initialize(audioContext) {
      nodeWrapper = createWorkletNodeWrapper(
        audioContext,
        workletUrl,
        workletProcessorName,
      );
      return nodeWrapper.outputNode;
    },
    async load() {
      await nodeWrapper.initialize();
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
