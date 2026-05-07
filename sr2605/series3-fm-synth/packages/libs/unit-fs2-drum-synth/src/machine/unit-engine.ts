import {
  createWorkletNodeWrapper,
  WorkletNodeWrapper,
} from "@my/lib/mo-music-app/worklet-node-wrapper";
import { KickParameterKey, UnitParameters } from "@/base/parameters";
import { defaultKickPreset, snarePreset1 } from "@/base/presets";
import {
  WorkletInputMessage,
  WorkletOutputMessage,
  workletProcessorName,
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
  initialize(audioContext: AudioContext): AudioNode;
  load(): Promise<void>;
  resumeIfNeed(): Promise<void>;
  getFullParameters(ch: number): UnitParameters;
  handleCommand(command: UnitEngineCommand): void;
};

export function createUnitEngine(): UnitEngine {
  type MyWorkletNodeWrapper = WorkletNodeWrapper<
    WorkletInputMessage,
    WorkletOutputMessage
  >;
  let nodeWrapper: MyWorkletNodeWrapper;

  const voiceParameters: UnitParameters[] = [
    { ...defaultKickPreset },
    { ...snarePreset1 },
  ];

  function sendInitialParameters() {
    voiceParameters.forEach((voiceParameters, ch) => {
      nodeWrapper.sendMessage({
        type: "setFullParameters",
        ch,
        parameters: voiceParameters,
      });
    });
  }
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
      sendInitialParameters();
    },
    async resumeIfNeed() {
      await nodeWrapper.resumeIfNeed();
    },
    getFullParameters(ch) {
      if (ch >= voiceParameters.length) {
        return { ...defaultKickPreset };
      }
      return voiceParameters[ch];
    },
    handleCommand(command) {
      if (command.type === "setParameter") {
        const { ch, paramKey, value } = command;
        (voiceParameters[ch][paramKey] as number | boolean) = value;
      }
      nodeWrapper.sendMessage(command);
    },
  };
}
