import { RootMachine } from "@ds9/base/types";
import { createDefaultScene } from "@ds9/machine/default-scene";
import {
  WorkletInputMessage,
  WorkletOutputMessage,
} from "@ds9/machine/worklet-types";
import { createWorkletNodeWrapper } from "@lib/mo-music-app/worklet-node-wrapper";
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
