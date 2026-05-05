import { createStoreMutations } from "@my/lib/ax-solid/store-mutations";
import { createStore } from "solid-js/store";
import {
  createDefaultUnitParameters,
  UnitParameters,
} from "@/synth-units/main-synthesizer/parameters";
import { UnitEngine } from "@/synth-units/main-synthesizer/unit-engine";

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
    noteOn(ch: number, noteNumber: number, velocity: number): void {
      unitEngine.handleCommand({
        type: "noteOn",
        channel: ch,
        noteNumber,
        velocity,
      });
    },
    noteOff(ch: number, noteNumber: number): void {
      unitEngine.handleCommand({
        type: "noteOff",
        channel: ch,
        noteNumber,
      });
    },
  };
  return {
    state,
    ...actions,
  };
}
