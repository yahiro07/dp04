import { createStoreMutations } from "@my/lib/ax-solid/store-mutations";
import { createStore } from "solid-js/store";
import {
  createDefaultUnitParameters,
  KickParameterKey,
  UnitParameters,
} from "@/base/parameters";
import { UnitEngine } from "@/machine/unit-engine";

export function createUiModel(unitEngine: UnitEngine) {
  type StoreState = {
    currentChannel: number;
    parameters: UnitParameters;
  };
  const initialState: StoreState = {
    currentChannel: -1,
    parameters: createDefaultUnitParameters(),
  };
  const [state, setState] = createStore<StoreState>(initialState);
  const storeMutations = createStoreMutations(setState, initialState);
  const actions = {
    setCurrentChannel(ch: number) {
      if (state.currentChannel !== ch) {
        storeMutations.setCurrentChannel(ch);
        const params = unitEngine.getFullParameters(ch);
        storeMutations.setParameters(params);
      }
    },
    setParameter<K extends KickParameterKey>(
      paramKey: K,
      value: UnitParameters[K],
    ) {
      storeMutations.setParameters((prev) => ({ ...prev, [paramKey]: value }));
      const ch = state.currentChannel;
      if (ch !== -1) {
        unitEngine.handleCommand({ type: "setParameter", ch, paramKey, value });
      }
    },
    playTone() {
      const ch = state.currentChannel;
      if (ch !== -1) {
        unitEngine.handleCommand({ type: "playTone", ch });
      }
    },
    dumpParameters() {
      console.log(JSON.stringify(state.parameters, null, " "));
    },
  };
  return {
    state,
    ...actions,
  };
}
