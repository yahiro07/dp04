import { createStoreMutations } from "@my/lib/ax-solid/store-mutations";
import { createStore } from "solid-js/store";
import {
  createDefaultUnitParameters,
  KickParameterKey,
  UnitParameters,
} from "../base/parameters";
import { DrumKitToneId } from "../base/types";
import { UnitEngine } from "../machine/unit-engine";

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
    setParameter<K extends KickParameterKey>(
      paramKey: K,
      value: UnitParameters[K],
    ) {
      storeMutations.setParameters((prev) => ({ ...prev, [paramKey]: value }));
      unitEngine.handleCommand({ type: "setParameter", paramKey, value });
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
