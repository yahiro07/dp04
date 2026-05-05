import { createWorkletNodeWrapper } from "@my/lib/mo-music-app/worklet-node-wrapper";
import { RootMachine } from "@/base/types";
import { createDefaultScene } from "@/machine/default-scene";
import {
  WorkletInputMessage,
  WorkletOutputMessage,
} from "@/machine/worklet-types";
import workletUrl from "./worklet.ts?worker&url";

export function createRootMachine(): RootMachine {
  const _navigator = navigator as { audioSession?: { type: string } };
  if (_navigator.audioSession) {
    _navigator.audioSession.type = "playback";
  }
  const audioContext = new AudioContext();

  const nodeWrapper = createWorkletNodeWrapper<
    WorkletInputMessage,
    WorkletOutputMessage
  >(audioContext, workletUrl);
  nodeWrapper.outputNode.connect(audioContext.destination);

  const initialScene = createDefaultScene();
  return {
    async initialize() {
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
