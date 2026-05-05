import {
  createDefaultUnitParameters,
  UnitParameters,
} from "@ds2/synth-units/drum-synthesizer/parameters";
import { DrumKitToneId } from "@ds2/synth-units/drum-synthesizer/types";
import { UnitEngine } from "@ds2/synth-units/drum-synthesizer/unit-engine";
import { createStoreMutations } from "@lib/ax-solid/store-mutations";
import { createStore } from "solid-js/store";

export function createUiModel(unitEngine: UnitEngine) {
  type StoreState = {
    parameters: UnitParameters;
  };
  const initialState: StoreState = {
    parameters: createDefaultUnitParameters(),
  };
  const [state, setState] = createStore<StoreState>(initialState);
  const storeMutations = createStoreMutations(setState, initialState);
  const actions = {
    setOscPitch(value: number) {
      storeMutations.setParameters({ oscPitch: value });
    },
    playTone(toneId: DrumKitToneId) {
      unitEngine.handleCommand({ type: "playTone", toneId });
    },
  };
  return {
    state,
    ...actions,
  };
}
