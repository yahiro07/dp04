import { createDrumSynthesizer } from "@ds2/synth-units/drum-synthesizer/unit-root";
import { createPartSynthesizer } from "@ds2/synth-units/part-synthesizer/unit-root";
import { createSequencer } from "@ds2/synth-units/sequencer/unit-root";

export function App() {
  const drumSynthesizer = createDrumSynthesizer();
  const partSynthesizer = createPartSynthesizer();
  const sequencer = createSequencer({
    drumSynthesizer,
    partSynthesizer,
  });
  const audioContext = new AudioContext();
  drumSynthesizer.setupEngine(audioContext);
  partSynthesizer.setupEngine(audioContext);
  sequencer.setupSequencerEngine(audioContext);

  return <sequencer.renderUi />;
}
