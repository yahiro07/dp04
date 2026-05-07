import { seqNumbers } from "@my/lib/ax/array-utils";
import {
  FeSelectorBox,
  Knob,
  ToggleBox,
} from "@my/lib/mo-solid/synth-components";
import {
  OperatorParameterKey,
  OperatorParameters,
  operatorWaveformOptions,
} from "@/base/parameters";
import { store, uiOperations } from "@/ui/store";

function OperatorSelectButton(props: {
  index: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      class="w-[32px] h-[32px] border border-[#888] flex-c cursor-pointer"
      style={{ background: props.selected ? "#cfc" : "#fff" }}
      onClick={() => props.onClick()}
    >
      {props.index + 1}
    </div>
  );
}

function OperatorSummaryRow(props: {
  opIndex: number;
  isCarrier: boolean;
  selected: boolean;
  handleSelect(): void;
  parameters: OperatorParameters;
  setParameter: (name: OperatorParameterKey, value: number | boolean) => void;
}) {
  return (
    <div class="flex-ha gap-3">
      <div class="min-w-[16px]">{props.isCarrier ? "C" : "M"}</div>
      <OperatorSelectButton
        index={props.opIndex}
        selected={props.selected}
        onClick={() => uiOperations.selectOperator(props.opIndex)}
      />
      <FeSelectorBox
        label="WAVE"
        options={operatorWaveformOptions}
        value={props.parameters.wave}
        onChange={(v) => props.setParameter("wave", v)}
      />
      <div
        class="w-[250px] h-[50px] border border-[#ccc] cursor-pointer"
        onClick={() => uiOperations.selectOperator(props.opIndex)}
      />
      <Knob
        value={props.parameters.level}
        onChange={(v) => props.setParameter("level", v)}
      />
      <ToggleBox
        checked={props.parameters.active}
        onChange={(v) => props.setParameter("active", v)}
      />
    </div>
  );
}

export function OperatorSummariesPart() {
  const vm = {
    isCarrier(index: number) {
      return store.operatorSchemes[index] === "C";
    },
    selIndex: () => store.operatorSelectionIndex,
  };
  return (
    <div class="flex-v gap-1">
      {seqNumbers(4).map((i) => {
        return (
          <OperatorSummaryRow
            opIndex={i}
            isCarrier={vm.isCarrier(i)}
            selected={vm.selIndex() === i}
            handleSelect={() => uiOperations.selectOperator(i)}
            parameters={store.operatorParameters[i]}
            setParameter={(name, value) =>
              uiOperations.setOperatorParameter(i, name, value)
            }
          />
        );
      })}
    </div>
  );
}
