import { seqNumbers } from "@my/lib/ax/array-utils";
import {
  createCommonParameters,
  createOperatorParameters,
} from "@/base/parameters";
import { Scene } from "@/base/types";

export function createDefaultScene(): Scene {
  return {
    operatorParameters: seqNumbers(4).map(createOperatorParameters),
    commonParameters: createCommonParameters(),
    modulationFlags: 0,
  };
}
