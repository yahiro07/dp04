import { createStoreMutations } from "@my/lib/ax-solid/store-mutations";
import { createStore } from "solid-js/store";
import { createDefaultUnitParameters, UnitParameters } from "./parameters";
import { DrumKitToneId } from "./types";
import { UnitEngine } from "./unit-engine";

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
