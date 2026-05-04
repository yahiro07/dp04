/* @refresh reload */

import { OperatorParameterKey } from "@ds9/base/parameters";
import { OperatorEditor } from "@ds9/ui/organisms/operator-editor";
import { OperatorSchemeEditor } from "@ds9/ui/organisms/operator-scheme-editor";
import { OperatorSchemesPresetSelector } from "@ds9/ui/organisms/operator-schemes-preset-selector";
import { OperatorSummariesPart } from "@ds9/ui/organisms/operator-summaries-part";
import { initializeApp, store, uiOperations } from "@ds9/ui/store";

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
        </div>
        <OperatorEditPart />
      </div>
    </div>
  );
}

export function App() {
  return <MainUi />;
}
