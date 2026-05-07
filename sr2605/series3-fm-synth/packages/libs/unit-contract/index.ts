import { JsxElement } from "@my/lib/ax-solid/types";

export type InstrumentSynthesizerUnit = {
  setupEngine(audioContext: AudioContext): AudioNode;
  loadEngine(): Promise<void>;
  noteOn(ch: number, noteNumber: number, velocity: number): void;
  noteOff(ch: number, noteNumber: number): void;
  renderUi(): JsxElement;
};

export type DrumSynthesizerUnit = {
  setupEngine(audioContext: AudioContext): AudioNode;
  loadEngine(): Promise<void>;
  playTone(ch: number): void;
  renderUi(props: { currentChannel: number }): JsxElement;
};

export type SequencerUnit = {
  setupSequencerEngine(): void;
  handleMidiInput(noteNumber: number, velocity: number): void;
  renderUi(): JsxElement;
};
