import { mountAppRoot } from "@my/lib/ax-solid/mount-app-root";
import { configureAudioSessionPlayback } from "@my/lib/mo-music-app/audio-context-helper";
import { createMainSynthesizerUnit } from "@my/main-synthesizer-unit";
import { createSequencerUnit } from "@my/sequencer-unit";
import { createUnitFs2DrumSynth } from "@my/unit-fs2-drum-synth";

function App() {
  configureAudioSessionPlayback();
  const audioContext = new AudioContext();
  const drumSynthesizer = createUnitFs2DrumSynth();
  const mainSynthesizer = createMainSynthesizerUnit();
  const sequencer = createSequencerUnit({
    audioContext,
    drumSynthesizer,
    mainSynthesizer,
  });
  const drumSynthOutputNode = drumSynthesizer.setupEngine(audioContext);
  const mainSynthOutputNode = mainSynthesizer.setupEngine(audioContext);
  sequencer.setupSequencerEngine();
  drumSynthOutputNode.connect(audioContext.destination);
  mainSynthOutputNode.connect(audioContext.destination);

  return <sequencer.renderUi />;
}

mountAppRoot(() => <App />);
