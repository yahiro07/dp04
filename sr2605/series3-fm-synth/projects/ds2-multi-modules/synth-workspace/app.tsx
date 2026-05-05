import { createDrumSynthesizer } from "@ds2/synth-units/drum-synthesizer/unit-root";
import { createPartSynthesizer } from "@ds2/synth-units/part-synthesizer/unit-root";
import { createSequencer } from "@ds2/synth-units/sequencer/unit-root";

export function App() {
  const audioContext = new AudioContext();
  const drumSynthesizer = createDrumSynthesizer(audioContext);
  const partSynthesizer = createPartSynthesizer(audioContext);
  const sequencer = createSequencer({
    audioContext,
    drumSynthesizer,
    partSynthesizer,
  });
  const drumSynthOutputNode = drumSynthesizer.setupEngine();
  const partSynthOutputNode = partSynthesizer.setupEngine();
  sequencer.setupSequencerEngine();
  drumSynthOutputNode.connect(audioContext.destination);
  partSynthOutputNode.connect(audioContext.destination);

  return <sequencer.renderUi />;
}
