/* @refresh reload */

import { OperatorParameterKey } from "@ds1/base/parameters";
import { EffectSection } from "@ds1/ui/organisms/effect-section";
import { OperatorEditor } from "@ds1/ui/organisms/operator-editor";
import { OperatorSchemeEditor } from "@ds1/ui/organisms/operator-scheme-editor";
import { OperatorSchemesPresetSelector } from "@ds1/ui/organisms/operator-schemes-preset-selector";
import { OperatorSummariesPart } from "@ds1/ui/organisms/operator-summaries-part";
import { initializeApp, store, uiOperations } from "@ds1/ui/store";

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
    <OperatorEditor
      isCarrier={vm.isCarrier()}
      parameters={vm.parameters()}
      setParameter={vm.setParameter}
    />
  );
}

function MainUi() {
  void initializeApp();
  return (
    <div class="w-dvw h-dvh flex-c">
      <div class="flex-vc gap-6">
        <div class="flex-ha gap-6">
          <FmAlgorithmPart />
          <OperatorSummariesPart />
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
