import { mountAppRoot } from "@my/lib/ax-solid/mount-app-root";
import {
  configureAudioSessionPlayback,
  resumeAudioContextIfNeed,
} from "@my/lib/mo-music-app/audio-context-helper";
import { setupMidiKeyboardInput } from "@my/lib/mo-music-app/midi-keyboard-input";
import { createUnitFs1FmSynth } from "@my/unit-fs1-fm-synth";

const synth = createUnitFs1FmSynth();

async function setupApplication() {
  configureAudioSessionPlayback();
  const audioContext = new AudioContext();
  const outputNode = synth.setupEngine(audioContext);
  outputNode.connect(audioContext.destination);
  void synth.loadEngine();
  setupMidiKeyboardInput({
    async noteCallback(noteNumber, velocity) {
      console.log("midi note", noteNumber, velocity);
      await resumeAudioContextIfNeed(audioContext);
      if (velocity > 0) {
        synth.noteOn(0, noteNumber, velocity);
      } else {
        synth.noteOff(0, noteNumber);
      }
    },
  });
}

function App() {
  void setupApplication();
  return <synth.renderUi />;
}

mountAppRoot(() => <App />);
