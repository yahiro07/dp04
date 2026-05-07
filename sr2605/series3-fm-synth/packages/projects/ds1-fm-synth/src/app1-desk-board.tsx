import { iife } from "@my/lib/ax/general-utils";
import { mountAppRoot } from "@my/lib/ax-solid/mount-app-root";
import {
  configureAudioSessionPlayback,
  resumeAudioContextIfNeed,
} from "@my/lib/mo-music-app/audio-context-helper";
import { setupMidiKeyboardInput } from "@my/lib/mo-music-app/midi-keyboard-input";
import { createUnitFs1FmSynth } from "@my/unit-fs1-fm-synth";
import { createUnitFs2DrumSynth } from "@my/unit-fs2-drum-synth";
import { createUnitFs3Sequencers } from "@my/unit-fs3-sequencers";

function App() {
  configureAudioSessionPlayback();
  const audioContext = new AudioContext();
  const drumSynthesizer = createUnitFs2DrumSynth();
  const mainSynthesizer = createUnitFs1FmSynth();
  const sequencer = createUnitFs3Sequencers({
    audioContext,
    drumSynthesizer,
    mainSynthesizer,
  });
  const drumSynthOutputNode = drumSynthesizer.setupEngine(audioContext);
  const mainSynthOutputNode = mainSynthesizer.setupEngine(audioContext);
  sequencer.setupSequencerEngine();
  drumSynthOutputNode.connect(audioContext.destination);
  mainSynthOutputNode.connect(audioContext.destination);
  iife(async () => {
    await drumSynthesizer.loadEngine();
    await mainSynthesizer.loadEngine();
  });

  setupMidiKeyboardInput({
    async noteCallback(noteNumber, velocity) {
      console.log("note", noteNumber, velocity);
      await resumeAudioContextIfNeed(audioContext);
      sequencer.handleMidiInput(noteNumber, velocity);
    },
  });
  return <sequencer.renderUi />;
}

mountAppRoot(() => <App />);
