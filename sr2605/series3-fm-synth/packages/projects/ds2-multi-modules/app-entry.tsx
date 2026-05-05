import { createDrumSynthesizerUnit } from "@my/drum-synthesizer-unit";
import { mountAppRoot } from "@my/lib/ax-solid/mount-app-root";
import { createMainSynthesizerUnit } from "@my/main-synthesizer-unit";
import { createSequencerUnit } from "@my/sequencer-unit";

function App() {
  const audioContext = new AudioContext();
  const drumSynthesizer = createDrumSynthesizerUnit();
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
