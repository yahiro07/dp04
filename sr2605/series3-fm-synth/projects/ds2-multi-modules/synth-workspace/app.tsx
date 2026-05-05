import { createDrumSynthesizer } from "@ds2/synth-units/drum-synthesizer/unit-root";
import { createMainSynthesizer } from "@ds2/synth-units/main-synthesizer/unit-root";
import { createSequencer } from "@ds2/synth-units/sequencer/unit-root";

export function App() {
  const audioContext = new AudioContext();
  const drumSynthesizer = createDrumSynthesizer(audioContext);
  const mainSynthesizer = createMainSynthesizer(audioContext);
  const sequencer = createSequencer({
    audioContext,
    drumSynthesizer,
    mainSynthesizer,
  });
  const drumSynthOutputNode = drumSynthesizer.setupEngine();
  const mainSynthOutputNode = mainSynthesizer.setupEngine();
  sequencer.setupSequencerEngine();
  drumSynthOutputNode.connect(audioContext.destination);
  mainSynthOutputNode.connect(audioContext.destination);

  return <sequencer.renderUi />;
}
