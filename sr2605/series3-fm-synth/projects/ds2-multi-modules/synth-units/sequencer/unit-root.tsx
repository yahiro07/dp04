import {
  DrumKitToneId,
  DrumSynthesizerUnit,
} from "@ds2/synth-units/drum-synthesizer/interface";
import { resumeAudioContextIfNeed } from "@lib/mo-music-app/resume-audio-context";
import { Button } from "@lib/mo-solid/components/button";
import { createSignal } from "solid-js";
import { MainSynthesizerUnit } from "../main-synthesizer/interface";
import { SequencerUnit } from "./interface";

export function createSequencer(args: {
  audioContext: AudioContext;
  drumSynthesizer: DrumSynthesizerUnit;
  mainSynthesizer: MainSynthesizerUnit;
}): SequencerUnit {
  const { audioContext, drumSynthesizer, mainSynthesizer } = args;

  return {
    setupSequencerEngine(): void {},
    renderUi() {
      const [currentToneId, setCurrentToneId] =
        createSignal<DrumKitToneId>("kick");

      const vm = {
        async playTone(toneId: DrumKitToneId) {
          await resumeAudioContextIfNeed(audioContext);
          drumSynthesizer.playTone(toneId);
          setCurrentToneId(toneId);
        },
        isToneActive(toneId: DrumKitToneId) {
          return currentToneId() === toneId;
        },
      };
      return (
        <div class="w-dvw h-dvh flex-vc">
          <div>
            <drumSynthesizer.renderUi currentToneId={currentToneId()} />
            <mainSynthesizer.renderUi />
          </div>
          <div class="w-[600px] flex-vl border border-[#aaa] gap-2 p-4">
            <div>sequencer</div>
            <div class="flex-v gap-2">
              <Button
                text="Kick"
                active={vm.isToneActive("kick")}
                onClick={() => vm.playTone("kick")}
              />
              <Button
                text="Snare"
                active={vm.isToneActive("snare")}
                onClick={() => vm.playTone("snare")}
              />
              <Button
                text="HiHat"
                active={vm.isToneActive("open-hi-hat")}
                onClick={() => vm.playTone("open-hi-hat")}
              />
              <Button
                text="ClHiHat"
                active={vm.isToneActive("closed-hi-hat")}
                onClick={() => vm.playTone("closed-hi-hat")}
              />
            </div>
          </div>
        </div>
      );
    },
  };
}
