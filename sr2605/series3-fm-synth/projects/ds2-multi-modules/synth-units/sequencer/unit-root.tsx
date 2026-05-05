import {
  DrumKitToneId,
  DrumSynthesizerUnit,
} from "@ds2/synth-units/drum-synthesizer/interface";
import { resumeAudioContextIfNeed } from "@lib/mo-music-app/resume-audio-context";
import { Button } from "@lib/mo-solid/components/button";
import { HoldableButton } from "@lib/mo-solid/components/holdable-button";
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
        noteOn(noteNumber: number) {
          mainSynthesizer.noteOn(0, noteNumber, 1);
        },
        noteOff(noteNumber: number) {
          mainSynthesizer.noteOff(0, noteNumber);
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
            <div class="flex-h">
              <HoldableButton
                text="note C"
                onDown={() => vm.noteOn(60)}
                onUp={() => vm.noteOff(60)}
              />
              <HoldableButton
                text="note D"
                onDown={() => vm.noteOn(62)}
                onUp={() => vm.noteOff(62)}
              />
              <HoldableButton
                text="note E"
                onDown={() => vm.noteOn(64)}
                onUp={() => vm.noteOff(64)}
              />
            </div>
          </div>
        </div>
      );
    },
  };
}
