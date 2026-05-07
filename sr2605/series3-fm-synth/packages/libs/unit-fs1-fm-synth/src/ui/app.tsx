/* @refresh reload */

import { OperatorParameterKey } from "@/base/parameters";
import { EffectSection } from "@/ui/organisms/effect-section";
import {
  OperatorEditorH,
  OperatorEditorL,
} from "@/ui/organisms/operator-editor";
import { OperatorSchemeEditor } from "@/ui/organisms/operator-scheme-editor";
import { OperatorSchemesPresetSelector } from "@/ui/organisms/operator-schemes-preset-selector";
import { OperatorSummariesPart } from "@/ui/organisms/operator-summaries-part";
import { store, uiOperations } from "@/ui/store";

function FmAlgorithmPart() {
  return (
    <div class="flex-vl gap-4">
      <OperatorSchemesPresetSelector
        operatorSchemes={store.operatorSchemes}
        setOperatorSchemes={uiOperations.setOperatorSchemes}
      />
      <OperatorSchemeEditor
        operatorSchemes={store.operatorSchemes}
        setOperatorSchemes={uiOperations.setOperatorSchemes}
      />
    </div>
  );
}

function OperatorEditPart() {
  const vm = {
    isCarrier() {
      const scheme = store.operatorSchemes[store.operatorSelectionIndex];
      return scheme === "C";
    },
    parameters() {
      return store.operatorParameters[store.operatorSelectionIndex];
    },
    setParameter(name: OperatorParameterKey, value: number | boolean) {
      uiOperations.setOperatorParameter(
        store.operatorSelectionIndex,
        name,
        value,
      );
    },
  };
  return (
    <div class="flex-vc gap-1">
      <OperatorEditorH
        isCarrier={vm.isCarrier()}
        parameters={vm.parameters()}
        setParameter={vm.setParameter}
      />
      <OperatorSummariesPart />
      <OperatorEditorL
        isCarrier={vm.isCarrier()}
        parameters={vm.parameters()}
        setParameter={vm.setParameter}
      />
    </div>
  );
}

function MainUi() {
  return (
    <div class="w-dvw h-dvh flex-c">
      <div class="flex-vc gap-6">
        <div class="flex-ha gap-6">
          <FmAlgorithmPart />
          <OperatorEditPart />
          <EffectSection
            parameters={store.commonParameters}
            setParameter={uiOperations.setCommonParameter}
          />
        </div>
        <div class="flex-ha gap-6"></div>
      </div>
    </div>
  );
}

export function App() {
  return <MainUi />;
}
