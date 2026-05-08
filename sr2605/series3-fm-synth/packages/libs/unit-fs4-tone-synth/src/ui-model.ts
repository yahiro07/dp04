import { createStoreMutations } from "@my/lib/ax-solid/store-mutations";
import { createStore } from "solid-js/store";
import { UnitParameters } from "@/parameters";
import { UnitEngine } from "@/unit-engine";

export function createUiModel(unitEngine: UnitEngine) {
  type StoreState = {
    parameters: UnitParameters;
  };
  const initialState: StoreState = {
    parameters: unitEngine.getParameters(),
  };
  const [state, setState] = createStore<StoreState>(initialState);
  const storeMutations = createStoreMutations(setState, initialState);
  const actions = {
    setParameter(key: keyof UnitParameters, value: number) {
      storeMutations.setParameters({ ...state.parameters, [key]: value });
      unitEngine.setParameter(key, value);
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
    ...actions,
  };
}
