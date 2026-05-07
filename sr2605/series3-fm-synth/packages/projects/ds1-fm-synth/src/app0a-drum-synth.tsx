import { mountAppRoot } from "@my/lib/ax-solid/mount-app-root";
import {
  configureAudioSessionPlayback,
  resumeAudioContextIfNeed,
} from "@my/lib/mo-music-app/audio-context-helper";
import { setupMidiKeyboardInput } from "@my/lib/mo-music-app/midi-keyboard-input";
import { createUnitFs2DrumSynth } from "@my/unit-fs2-drum-synth";

const synth = createUnitFs2DrumSynth();

async function setupApplication() {
  configureAudioSessionPlayback();
  const audioContext = new AudioContext();
  const outputNode = await synth.setupEngine(audioContext);
  outputNode.connect(audioContext.destination);
  setupMidiKeyboardInput({
    async noteCallback(noteNumber, velocity) {
      await resumeAudioContextIfNeed(audioContext);
      const ch = noteNumber % 12;
      if (velocity > 0) {
        synth.playTone(ch);
      }
    },
  });
}

function App() {
  void setupApplication();
  return <synth.renderUi currentChannel={0} />;
}

mountAppRoot(() => <App />);
