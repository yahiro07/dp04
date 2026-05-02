declare module "webaudio-tinysynth" {
  export default class WebAudioTinySynth {
    actx: AudioContext;

    constructor(options?: {
      quality?: number;
      voices?: number;
      useReverb?: number;
    });

    allSoundOff(channel: number): void;
    noteOff(channel: number, note: number, when?: number): void;
    noteOn(channel: number, note: number, velocity: number, when?: number): void;
    setChVol(channel: number, value: number, when?: number): void;
    setProgram(channel: number, program: number): void;
  }
}