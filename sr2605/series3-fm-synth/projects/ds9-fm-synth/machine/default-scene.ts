import {
  createCommonParameters,
  createOperatorParameters,
} from "@ds9/base/parameters";
import { Scene } from "@ds9/base/types";
import { seqNumbers } from "@lib/ax/array-utils";

export function createDefaultScene(): Scene {
  return {
    operatorParameters: seqNumbers(4).map(createOperatorParameters),
    commonParameters: createCommonParameters(),
    modulationFlags: 0,
  };
}
