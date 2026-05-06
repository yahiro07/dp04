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
    currentChannel: 0,
    parameters: createDefaultUnitParameters(),
  };
  const [state, setState] = createStore<StoreState>(initialState);
  const storeMutations = createStoreMutations(setState, initialState);
  const actions = {
    setCurrentChannel(ch: number) {
      storeMutations.setCurrentChannel(ch);
    },
    setParameter<K extends KickParameterKey>(
      paramKey: K,
      value: UnitParameters[K],
    ) {
      storeMutations.setParameters((prev) => ({ ...prev, [paramKey]: value }));
      const ch = state.currentChannel;
      unitEngine.handleCommand({ type: "setParameter", ch, paramKey, value });
    },
    playTone() {
      const ch = state.currentChannel;
      unitEngine.handleCommand({ type: "playTone", ch });
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
