declare module "webaudio-tinysynth" {
  export interface WebAudioTinySynthOptions {
    quality?: number;
    useReverb?: number;
    voices?: number;
  }

  export default class WebAudioTinySynth {
    constructor(options?: WebAudioTinySynthOptions);
    getAudioContext(): AudioContext;
    setProgram(channel: number, program: number): void;
    noteOn(
      channel: number,
      note: number,
      velocity: number,
      time?: number,
    ): void;
    noteOff(channel: number, note: number, time?: number): void;
    allSoundOff(channel: number): void;
  }
}
