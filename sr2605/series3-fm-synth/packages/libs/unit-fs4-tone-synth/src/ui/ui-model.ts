import { createStoreMutations } from "@my/lib/ax-solid/store-mutations";
import { createStore } from "solid-js/store";
import { UnitParameters } from "@/core/parameters";
import { UnitEngine } from "@/core/unit-engine";

export function createUiModel(unitEngine: UnitEngine) {
  const initialChannel = unitEngine.getCurrentChannel();
  const initialParameters = unitEngine.getParameters(initialChannel);
  type StoreState = {
    currentChannel: number;
    parameters: UnitParameters;
  };
  const initialState: StoreState = {
    currentChannel: initialChannel,
    parameters: initialParameters,
  };
  const [state, setState] = createStore<StoreState>(initialState);
  const storeMutations = createStoreMutations(setState, initialState);
  const actions = {
    setParameter(key: keyof UnitParameters, value: number) {
      const ch = state.currentChannel;
      storeMutations.setParameters({ ...state.parameters, [key]: value });
      unitEngine.setParameter(ch, key, value);
    },
    selectChannel(ch: number) {
      storeMutations.setCurrentChannel(ch);
      storeMutations.setParameters(unitEngine.getParameters(ch));
      unitEngine.setCurrentChannel(ch);
    },
    noteOn(ch: number, noteNumber: number): void {
      unitEngine.noteOn(ch, noteNumber);
    },
    noteOff(ch: number, noteNumber: number): void {
      unitEngine.noteOff(ch, noteNumber);
    },
  };
  return {
    state,
    actions,
  };
}
