/* @refresh reload */

import { replaceArrayItem } from "@lib/ax/array-utils";
import { iife } from "@lib/ax/general-utils";
import { mountAppRoot } from "@lib/ax-solid/mount-app-root";
import { createStoreMutations } from "@lib/ax-solid/store-mutations";
import { createMemo, Show } from "solid-js";
import { createStore } from "solid-js/store";

type OperatorScheme = "C" | "M" | "J" | "J2";

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
          if (scheme === "M") return "J";
          if (scheme === "J") return "J2";
          return "C";
        }
        if (index === 1) {
          return scheme === "C" ? "M" : scheme === "M" ? "J" : "C";
        } else {
          return scheme === "C" ? "M" : "C";
        }
      };
      const newScheme = getNextScheme(index, scheme);
      replaceScheme(index, newScheme);
    },
  };

  const rowModels = createMemo(() => {
    const schemes = props.operatorSchemes;
    const headScheme = props.operatorSchemes[0];
    const secondScheme = props.operatorSchemes[1];

    const sideFlowMarks = iife(() => {
      if (headScheme === "J2" && secondScheme === "J") {
        return ["↴", "↴", "|", "↲"];
      } else if (headScheme === "J" && secondScheme === "J") {
        return ["↴", "|", "↲", ""];
      } else if (headScheme === "J") {
        return ["↴", "|", "↲", ""];
      } else if (headScheme === "J2") {
        return ["↴", "|", "|", "↲"];
      } else if (secondScheme === "J") {
        return ["", "↴", "|", "↲"];
      }
      return ["", "", "", ""];
    });

    return schemes.map((scheme, index) => {
      const shiftIcon = {
        C: "→",
        M: "↓",
        J: "↴",
        J2: "↴",
      }[scheme];
      const operatorTypeText = scheme === "C" ? "C" : "M";
      const operatorTypeTextRaw = scheme;
      let showModArrow = scheme === "M";
      const sideFlowMark = sideFlowMarks[index];
      if (headScheme === "J" && secondScheme === "J" && index === 1) {
        //normalize connection display
        showModArrow = true;
      }
      return {
        scheme,
        shiftIcon,
        operatorTypeText,
        operatorTypeTextRaw,
        showModArrow,
        sideFlowMark,
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
            style={
              item.sideFlowMark === "|" ? { "padding-left": "8px" } : undefined
            }
          >
            {item.sideFlowMark}
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
