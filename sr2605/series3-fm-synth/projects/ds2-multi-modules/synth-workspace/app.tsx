import {
  createDrumSynthesizerUnit,
  createMainSynthesizerUnit,
  createSequencerUnit,
} from "@ds2/synth-units";

export function App() {
  const audioContext = new AudioContext();
  const drumSynthesizer = createDrumSynthesizerUnit(audioContext);
  const mainSynthesizer = createMainSynthesizerUnit();
  const sequencer = createSequencerUnit({
    audioContext,
    drumSynthesizer,
    mainSynthesizer,
  });
  const drumSynthOutputNode = drumSynthesizer.setupEngine();
  const mainSynthOutputNode = mainSynthesizer.setupEngine(audioContext);
  sequencer.setupSequencerEngine();
  drumSynthOutputNode.connect(audioContext.destination);
  mainSynthOutputNode.connect(audioContext.destination);

  return <sequencer.renderUi />;
}
