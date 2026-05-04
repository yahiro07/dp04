/* @refresh reload */

import { replaceArrayItem } from "@lib/ax/array-utils";
import { mountAppRoot } from "@lib/ax-solid/mount-app-root";
import { createStoreMutations } from "@lib/ax-solid/store-mutations";
import { Show } from "solid-js";
import { createStore } from "solid-js/store";

type OperatorScheme = "C" | "M" | "J1" | "J2";

type StoreState = {
  operatorSchemes: OperatorScheme[];
};

const initialState: StoreState = {
  operatorSchemes: ["M", "C", "M", "C"],
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
      if (index <= 2) {
        return scheme === "C" ? "M" : "C";
      } else {
        return scheme === "C" ? "J1" : scheme === "J1" ? "J2" : "C";
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
            {scheme === "C" ? "→" : "↓"}
          </div>
          <div class="relative bd-red">
            <div class="w-[32px] h-[32px] border border-[#888] flex-c rounded-full">
              {index + 1}
            </div>
            <div
              class="absolute top-full left-0"
              style={{
                transform: `translate(16px, 0px)`,
              }}
            >
              <Show when={scheme === "M"}>
                <div class=" w-[1px] h-[16px] border-l border-[#888]" />
              </Show>
            </div>
          </div>
          <div class="w-[16px] flex-c">
            <Show when={index === 0 && vm.operatorSchemes()[3] === "J1"}>
              ↴
            </Show>
            <Show when={index === 1 && vm.operatorSchemes()[3] === "J1"}>
              <div class="pl-2.5">|</div>
            </Show>
            <Show when={index === 2 && vm.operatorSchemes()[3] === "J1"}>
              ↲
            </Show>
            <Show when={index === 0 && vm.operatorSchemes()[3] === "J2"}>
              ↴
            </Show>
            <Show when={index === 1 && vm.operatorSchemes()[3] === "J2"}>
              <div class="pl-2.5">|</div>
            </Show>
            <Show when={index === 2 && vm.operatorSchemes()[3] === "J2"}>
              <div class="pl-2.5">|</div>
            </Show>
            <Show when={index === 3 && vm.operatorSchemes()[3] === "J2"}>
              ↲
            </Show>
          </div>
          <div>{index === 3 ? "C" : scheme}</div>
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
