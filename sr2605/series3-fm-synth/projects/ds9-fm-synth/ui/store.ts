import {
  createOperatorParameters,
  OperatorParameterKey,
  OperatorParameters,
} from "@ds9/base/parameters";
import {
  ModulationFlagBitPosition,
  OperatorScheme,
  RootMachineCommand,
} from "@ds9/base/types";
import { createRootMachine } from "@ds9/machine/root-machine";
import { seqNumbers } from "@lib/ax/array-utils";
import { createStoreMutations } from "@lib/ax-solid/store-mutations";
import { setupMidiKeyboardInput } from "@lib/mo-music-app/midi-keyboard-input";
import { createStore } from "solid-js/store";

const rootMachine = createRootMachine();

type StoreState = {
  operatorSelectionIndex: number;
  operatorSchemes: OperatorScheme[];
  operatorParameters: OperatorParameters[];
  loading: boolean;
};

const initialState: StoreState = {
  operatorSelectionIndex: 0,
  operatorSchemes: ["C", "C", "M", "C"],
  operatorParameters: seqNumbers(4).map(createOperatorParameters),
  loading: false,
};

export const [store, setStore] = createStore<StoreState>(initialState);
const storeMutations = createStoreMutations(setStore, initialState);

function emitMachineCommand(command: RootMachineCommand) {
  rootMachine.handleCommand(command);
}

function calculateModulationFlags(schemes: OperatorScheme[]): number {
  let flags = 0;
  const bp = ModulationFlagBitPosition;
  const setFlagBit = (pos: ModulationFlagBitPosition, enabled: boolean) => {
    if (enabled) {
      flags |= 1 << (pos - 1);
    }
  };
  setFlagBit(bp.mod01, schemes[0] === "M");
  setFlagBit(bp.mod12, schemes[1] === "M");
  setFlagBit(bp.mod23, schemes[2] === "M");
  setFlagBit(bp.mod02, schemes[0] === "J");
  setFlagBit(bp.mod03, schemes[0] === "J2");
  setFlagBit(bp.mod13, schemes[1] === "J");
  return flags;
}

export const uiOperations = {
  setOperatorSchemes(newSchemes: OperatorScheme[]) {
    storeMutations.setOperatorSchemes(newSchemes);
    const flags = calculateModulationFlags(newSchemes);
    emitMachineCommand({ type: "setModulationFlags", flags });
  },
  selectOperator(index: number) {
    storeMutations.setOperatorSelectionIndex(index);
  },
  setOperatorParameter(
    opIndex: number,
    paramKey: OperatorParameterKey,
    value: number | boolean,
  ) {
    storeMutations.setOperatorParameters((prev) => ({
      ...prev,
      [opIndex]: {
        ...prev[opIndex],
        [paramKey]: value,
      },
    }));
    emitMachineCommand({
      type: "setOperatorParameter",
      opIndex,
      paramKey,
      value,
    });
  },
  async handleNote(noteNumber: number, velocity: number) {
    await rootMachine.resumeIfNeed();
    if (velocity > 0) {
      emitMachineCommand({ type: "noteOn", noteNumber, velocity });
    } else {
      emitMachineCommand({ type: "noteOff", noteNumber });
    }
  },
};

export async function initializeApp() {
  storeMutations.setLoading(true);
  await rootMachine.initialize();
  storeMutations.setLoading(false);
  const scene = rootMachine.getSceneState();
  storeMutations.setOperatorParameters(scene.operatorParameters);
  uiOperations.setOperatorSchemes(store.operatorSchemes);
  for (let i = 0; i < 3; i++) {
    uiOperations.setOperatorParameter(i, "active", false);
  }
  uiOperations.selectOperator(3);
  setupMidiKeyboardInput({
    noteCallback: uiOperations.handleNote,
  });
}
