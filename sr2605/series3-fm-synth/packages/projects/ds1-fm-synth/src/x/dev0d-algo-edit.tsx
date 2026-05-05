/* @refresh reload */

import { replaceArrayItem } from "@my/lib/ax/array-utils";
import { iife } from "@my/lib/ax/general-utils";
import { mountAppRoot } from "@my/lib/ax-solid/mount-app-root";
import { createStoreMutations } from "@my/lib/ax-solid/store-mutations";
import { createMemo, Show } from "solid-js";
import { createStore } from "solid-js/store";

type OperatorScheme = "C" | "M" | "J1" | "J2";

type StoreState = {
  operatorSchemes: OperatorScheme[];
};

const initialState: StoreState = {
  operatorSchemes: ["C", "C", "C", "C"],
};

const [store, setStore] = createStore<StoreState>(initialState);
const storeMutations = createStoreMutations(setStore, initialState);

function OperatorSchemeEditor(props: {
  operatorSchemes: OperatorScheme[];
  setOperatorSchemes: (operatorSchemes: OperatorScheme[]) => void;
}) {
  const handlers = {
    shiftOperatorScheme(index: number) {
      const scheme = props.operatorSchemes[index];
      const replaceScheme = (index: number, scheme: OperatorScheme) => {
        const newSchemes = replaceArrayItem(
          props.operatorSchemes,
          index,
          scheme,
        );
        props.setOperatorSchemes(newSchemes);
      };
      const getNextScheme = (index: number, scheme: OperatorScheme) => {
        if (index === 0) {
          if (scheme === "C") return "M";
          if (scheme === "M") return "J1";
          if (scheme === "J1") return "J2";
          return "C";
        } else if (index === 1) {
          if (scheme === "C") return "M";
          if (scheme === "M") return "J1";
          return "C";
        }
        return scheme === "C" ? "M" : "C";
      };
      const newScheme = getNextScheme(index, scheme);
      replaceScheme(index, newScheme);
    },
  };

  const rowModels = createMemo(() => {
    const schemes = props.operatorSchemes;
    const headScheme = props.operatorSchemes[0];
    const secondScheme = props.operatorSchemes[1];

    const leftFlowMarks = iife(() => {
      if (secondScheme === "J1") {
        return ["", "↴", "|", "↲"];
      }
      return ["", "", "", ""];
    });

    const rightFlowMarks = iife(() => {
      if (headScheme === "J1") {
        return ["↴", "|", "↲", ""];
      } else if (headScheme === "J2") {
        return ["↴", "|", "|", "↲"];
      }
      return ["", "", "", ""];
    });

    return schemes.map((scheme, index) => {
      const shiftIcon = {
        C: "→",
        M: "↓",
        J1: "↴",
        J2: "↴",
      }[scheme];
      const operatorTypeText = scheme === "C" ? "C" : "M";
      const operatorTypeTextRaw = scheme;
      const showModArrow = scheme === "M";
      const leftFlowMark = leftFlowMarks[index];
      const rightFlowMark = rightFlowMarks[index];
      return {
        scheme,
        shiftIcon,
        operatorTypeText,
        operatorTypeTextRaw,
        showModArrow,
        leftFlowMark,
        rightFlowMark,
      };
    });
  });
  return (
    <div class="flex-vl gap-4">
      {rowModels().map((item, index) => (
        <div class="flex-ha">
          <div class="w-[20px]">
            <Show when={index <= 2}>
              <div
                class="w-[20px] cursor-pointer"
                onClick={() => handlers.shiftOperatorScheme(index)}
              >
                {item.shiftIcon}
              </div>
            </Show>
          </div>
          <div class="pl-3" />
          <div class="w-[20px]">{item.operatorTypeTextRaw}</div>

          <div class="pl-2" />
          <div class="relative">
            <div class="w-[32px] h-[32px] border border-[#888] flex-c rounded-full">
              {index + 1}
            </div>
            <div
              class="absolute top-full left-0"
              style={{
                transform: `translate(10px, -4px)`,
              }}
            >
              <Show when={item.showModArrow}>
                <div>↓</div>
              </Show>
            </div>
          </div>
          <div
            class="w-[16px] flex-c"
            style={{
              "padding-left": item.leftFlowMark === "|" ? "8px" : undefined,
            }}
          >
            {item.leftFlowMark}
          </div>
          <div
            class="w-[16px] flex-c"
            style={
              item.rightFlowMark === "|" ? { "padding-left": "8px" } : undefined
            }
          >
            {item.rightFlowMark}
          </div>
        </div>
      ))}
    </div>
  );
}

function MainUi() {
  return (
    <div class="w-dvw h-dvh p-2 flex-c">
      <OperatorSchemeEditor
        operatorSchemes={store.operatorSchemes}
        setOperatorSchemes={storeMutations.setOperatorSchemes}
      />
    </div>
  );
}

function App() {
  return <MainUi />;
}

mountAppRoot(() => <App />);
