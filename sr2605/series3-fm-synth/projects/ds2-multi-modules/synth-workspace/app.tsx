import { createDrumSynthesizer } from "@ds2/synth-units/drum-synthesizer/unit-root";
import { createPartSynthesizer } from "@ds2/synth-units/part-synthesizer/unit-root";
import { createSequencer } from "@ds2/synth-units/sequencer/unit-root";
import { For } from "solid-js";

export function App() {
  const drumSynthesizer = createDrumSynthesizer();
  const partSynthesizer = createPartSynthesizer();
  const sequencer = createSequencer();

  const audioContext = new AudioContext();
  drumSynthesizer.setupEngine(audioContext);
  partSynthesizer.setupEngine(audioContext);
  sequencer.setupSequencerEngine(audioContext);

  return (
    <div class="w-dvw h-dvh flex-vc gap-6">
      <For each={[drumSynthesizer, partSynthesizer, sequencer]}>
        {(unit) => unit.renderUi()}
      </For>
    </div>
  );
}
