import WebAudioTinySynth from "webaudio-tinysynth";

type MidiSoundEngine = {
  initialize(): void;
  noteOn(channel: number, noteNumber: number, velocity: number): void;
  noteOff(channel: number, noteNumber: number): void;
  allSoundOff(channel: number): void;
  setProgram(channel: number, program: number): void;
};

function createMidiSoundEngine(): MidiSoundEngine {
  let synth: WebAudioTinySynth | null = null;
  const programByChannel = new Map<number, number>();

  const getSynth = () => {
    if (synth) {
      return synth;
    }

    synth = new WebAudioTinySynth({
      quality: 1,
      useReverb: 1,
      voices: 64,
    });

    for (const [channel, program] of programByChannel) {
      synth.setProgram(channel, program);
    }

    return synth;
  };

  return {
    initialize() {
      getSynth();
    },
    noteOn(channel, noteNumber, velocity) {
      const currentSynth = getSynth();
      void currentSynth.getAudioContext().resume();
      currentSynth.noteOn(channel, noteNumber, velocity);
    },
    noteOff(channel, noteNumber) {
      getSynth().noteOff(channel, noteNumber);
    },
    allSoundOff(channel) {
      getSynth().allSoundOff(channel);
    },
    setProgram(channel, program) {
      programByChannel.set(channel, program);
      getSynth().setProgram(channel, program);
    },
  };
}

export const midiSoundEngine = createMidiSoundEngine();
