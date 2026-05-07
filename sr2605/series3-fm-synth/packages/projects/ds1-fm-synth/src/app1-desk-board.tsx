import { iife } from "@my/lib/ax/general-utils";
import { mountAppRoot } from "@my/lib/ax-solid/mount-app-root";
import {
  configureAudioSessionPlayback,
  resumeAudioContextIfNeed,
} from "@my/lib/mo-music-app/audio-context-helper";
import { setupMidiKeyboardInput } from "@my/lib/mo-music-app/midi-keyboard-input";
import { createSequencerUnit } from "@my/sequencer-unit";
import { createUnitFs1FmSynth } from "@my/unit-fs1-fm-synth";
import { createUnitFs2DrumSynth } from "@my/unit-fs2-drum-synth";

function App() {
  configureAudioSessionPlayback();
  const audioContext = new AudioContext();
  const drumSynthesizer = createUnitFs2DrumSynth();
  const mainSynthesizer = createUnitFs1FmSynth();
  const sequencer = createSequencerUnit({
    audioContext,
    drumSynthesizer,
    mainSynthesizer,
  });
  iife(async () => {
    const drumSynthOutputNode = await drumSynthesizer.setupEngine(audioContext);
    const mainSynthOutputNode = await mainSynthesizer.setupEngine(audioContext);
    sequencer.setupSequencerEngine();
    drumSynthOutputNode.connect(audioContext.destination);
    mainSynthOutputNode.connect(audioContext.destination);
    setupMidiKeyboardInput({
      async noteCallback(noteNumber, velocity) {
        await resumeAudioContextIfNeed(audioContext);
        sequencer.handleMidiInput(noteNumber, velocity);
      },
    });
  });
  return <sequencer.renderUi />;
}

mountAppRoot(() => <App />);
