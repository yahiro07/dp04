import { seqNumbers } from "@my/lib/ax/array-utils";
import { createStoreMutations } from "@my/lib/ax-solid/store-mutations";
import { createStore } from "solid-js/store";
import {
  CommonParameterKey,
  CommonParameters,
  createCommonParameters,
  createOperatorParameters,
  OperatorParameterKey,
  OperatorParameters,
} from "@/base/parameters";
import {
  ModulationFlagBitPosition,
  OperatorScheme,
  RootMachineCommand,
} from "@/base/types";
import { rootMachine } from "@/machine/root-machine";

type StoreState = {
  operatorSelectionIndex: number;
  operatorSchemes: OperatorScheme[];
  operatorParameters: OperatorParameters[];
  commonParameters: CommonParameters;
  loading: boolean;
};

const initialState: StoreState = {
  operatorSelectionIndex: 0,
  operatorSchemes: ["C", "C", "M", "C"],
  operatorParameters: seqNumbers(4).map(createOperatorParameters),
  commonParameters: createCommonParameters(),
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
      flags |= 1 << pos;
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
  setCommonParameter(paramKey: CommonParameterKey, value: number | boolean) {
    storeMutations.setCommonParameters((prev) => ({
      ...prev,
      [paramKey]: value,
    }));
    emitMachineCommand({ type: "setCommonParameter", paramKey, value });
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

export async function initializeApp(audioContext: AudioContext) {
  storeMutations.setLoading(true);
  const outputNode = await rootMachine.initialize(audioContext);
  storeMutations.setLoading(false);
  const scene = rootMachine.getSceneState();
  storeMutations.setOperatorParameters(scene.operatorParameters);
  storeMutations.setCommonParameters(scene.commonParameters);
  uiOperations.setOperatorSchemes(store.operatorSchemes);
  for (let i = 0; i < 3; i++) {
    uiOperations.setOperatorParameter(i, "active", false);
  }
  uiOperations.selectOperator(3);
  if (1) {
    // uiOperations.setOperatorParameter(3, "wave", OperatorWave.Saw);
    uiOperations.setOperatorParameter(3, "unisonNum", 5);
  }
  return outputNode;
}
