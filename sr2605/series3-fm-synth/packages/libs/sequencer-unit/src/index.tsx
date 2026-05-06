import { JsxElement } from "@my/lib/ax-solid/types";
import { resumeAudioContextIfNeed } from "@my/lib/mo-music-app/audio-context-helper";
import { Button } from "@my/lib/mo-solid/components/button";
import { HoldableButton } from "@my/lib/mo-solid/components/holdable-button";
import { MainSynthesizerUnit } from "@my/main-synthesizer-unit";
import { UnitFs2DrumSynth } from "@my/unit-fs2-drum-synth";
import { createSignal } from "solid-js";

export type SequencerUnit = {
  setupSequencerEngine(): void;
  handleMidiInput(noteNumber: number, velocity: number): void;
  renderUi(): JsxElement;
};

type DrumKitToneId = "kick" | "snare" | "openHiHat" | "closedHiHat";

const toneIdToChannelMap = {
  kick: 0,
  snare: 1,
  openHiHat: 2,
  closedHiHat: 3,
};

export function createSequencerUnit(args: {
  audioContext: AudioContext;
  drumSynthesizer: UnitFs2DrumSynth;
  mainSynthesizer: MainSynthesizerUnit;
}): SequencerUnit {
  const { audioContext, drumSynthesizer, mainSynthesizer } = args;

  return {
    setupSequencerEngine(): void {},
    handleMidiInput(noteNumber, velocity) {
      if (noteNumber === 48) {
        if (velocity > 0) {
          drumSynthesizer.playTone(toneIdToChannelMap["kick"]);
        }
      } else if (noteNumber === 49) {
        if (velocity > 0) {
          drumSynthesizer.playTone(toneIdToChannelMap["snare"]);
        }
      } else {
        if (velocity > 0) {
          mainSynthesizer.noteOn(0, noteNumber, velocity);
        } else {
          mainSynthesizer.noteOff(0, noteNumber);
        }
      }
    },
    renderUi() {
      const [currentToneId, setCurrentToneId] =
        createSignal<DrumKitToneId>("kick");
      const vm = {
        async playTone(toneId: DrumKitToneId) {
          await resumeAudioContextIfNeed(audioContext);
          drumSynthesizer.playTone(toneIdToChannelMap[toneId]);
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
            <drumSynthesizer.renderUi
              currentChannel={toneIdToChannelMap[currentToneId()]}
            />
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
                active={vm.isToneActive("openHiHat")}
                onClick={() => vm.playTone("openHiHat")}
              />
              <Button
                text="ClHiHat"
                active={vm.isToneActive("closedHiHat")}
                onClick={() => vm.playTone("closedHiHat")}
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
