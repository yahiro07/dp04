/* @refresh reload */

import { replaceArrayItem } from "@lib/ax/array-utils";
import { mountAppRoot } from "@lib/ax-solid/mount-app-root";
import { createStoreMutations } from "@lib/ax-solid/store-mutations";
import { Show } from "solid-js";
import { createStore } from "solid-js/store";

type OperatorScheme = "B" | "P" | "J1" | "J2";

type StoreState = {
  operatorSchemes: OperatorScheme[];
};

const initialState: StoreState = {
  operatorSchemes: ["B", "P", "B", "P"],
};

const [store, setStore] = createStore<StoreState>(initialState);
const storeMutations = createStoreMutations(setStore, initialState);

const uiActions = {
  shiftOperatorScheme(index: number) {
    const scheme = store.operatorSchemes[index];
    const replaceScheme = (index: number, scheme: OperatorScheme) => {
      storeMutations.setOperatorSchemes((prev) =>
        replaceArrayItem(prev, index, scheme),
      );
    };
    const getNextScheme = (index: number, scheme: OperatorScheme) => {
      if (index === 0) {
        return scheme === "B" ? "J1" : scheme === "J1" ? "J2" : "B";
      } else {
        return scheme === "B" ? "P" : "B";
      }
    };
    const newScheme = getNextScheme(index, scheme);
    replaceScheme(index, newScheme);
  },
};

function FmAlgorithmPart() {
  const vm = {
    operatorSchemes: () => store.operatorSchemes,
  };
  return (
    <div class="flex-vl gap-4">
      {vm.operatorSchemes().map((scheme, index) => (
        <div class="flex-ha gap-4">
          <div
            class="w-[20px] cursor-pointer"
            onClick={() => uiActions.shiftOperatorScheme(index)}
          >
            {scheme === "B" ? "o" : "↓"}
          </div>
          <div class="relative">
            <div class="w-[32px] h-[32px] border border-[#888] flex-c rounded-full">
              {index + 1}
            </div>
            <div
              class="absolute bottom-full left-0"
              style={{
                transform: `translate(10px, 4px)`,
              }}
            >
              <Show when={scheme === "P"}>
                <div>↓</div>
              </Show>
            </div>
          </div>
          <div class="w-[16px] flex-c">
            <Show when={index === 0 && vm.operatorSchemes()[0] === "J1"}>
              ↴
            </Show>
            <Show when={index === 1 && vm.operatorSchemes()[0] === "J1"}>
              <div class="pl-2.5">|</div>
            </Show>
            <Show when={index === 2 && vm.operatorSchemes()[0] === "J1"}>
              ↲
            </Show>
            <Show when={index === 0 && vm.operatorSchemes()[0] === "J2"}>
              ↴
            </Show>
            <Show when={index === 1 && vm.operatorSchemes()[0] === "J2"}>
              <div class="pl-2.5">|</div>
            </Show>
            <Show when={index === 2 && vm.operatorSchemes()[0] === "J2"}>
              <div class="pl-2.5">|</div>
            </Show>
            <Show when={index === 3 && vm.operatorSchemes()[0] === "J2"}>
              ↲
            </Show>
          </div>
          <div>{scheme}</div>
          <div>
            {scheme === "J1" ||
            scheme === "J2" ||
            vm.operatorSchemes()[index + 1] === "P"
              ? "M"
              : "C"}
          </div>
        </div>
      ))}
    </div>
  );
}

function MainUi() {
  return (
    <div class="w-dvw h-dvh p-2 flex-c">
      <FmAlgorithmPart />
    </div>
  );
}

function App() {
  return <MainUi />;
}

mountAppRoot(() => <App />);
