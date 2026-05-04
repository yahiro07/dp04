import { OperatorParameterKey, OperatorParameters } from "@ds9/base/parameters";
import { Knob } from "@ds9/ui/components/knob";
import { ToggleBox } from "@ds9/ui/components/toggle-box";
import { store, uiOperations } from "@ds9/ui/store";
import { seqNumbers } from "@lib/ax/array-utils";

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
  selected: boolean;
  handleSelect(): void;
  parameters: OperatorParameters;
  setParameter: (name: OperatorParameterKey, value: number | boolean) => void;
}) {
  return (
    <div class="flex-ha gap-3">
      <OperatorSelectButton
        index={props.opIndex}
        selected={props.selected}
        onClick={() => uiOperations.selectOperator(props.opIndex)}
      />
      <div
        class="w-[200px] h-[40px] border border-[#ccc] cursor-pointer"
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
    selIndex: () => store.operatorSelectionIndex,
  };
  return (
    <div class="flex-v gap-1">
      {seqNumbers(4).map((i) => {
        return (
          <OperatorSummaryRow
            opIndex={i}
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
