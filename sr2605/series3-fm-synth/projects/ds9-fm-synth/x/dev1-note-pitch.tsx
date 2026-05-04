/* @refresh reload */

import { seqNumbers } from "@lib/ax/array-utils";
import { mountAppRoot } from "@lib/ax-solid/mount-app-root";
import { createStoreMutations } from "@lib/ax-solid/store-mutations";
import { createStore } from "solid-js/store";

type StoreState = {
  relNoteNumber: number;
};

const initialState: StoreState = {
  relNoteNumber: 0,
};

const [store, setStore] = createStore<StoreState>(initialState);
const storeMutations = createStoreMutations(setStore, initialState);

const uiActions = {};

function NoteInputBar_Normal() {
  return (
    <div class="flex-v">
      {seqNumbers(37).map((i) => {
        const ni = 36 - i - 12;
        const highlighted = ni % 12 === 0;
        return (
          <div
            class="w-[60px] h-[20px] border border-[#888] flex-c text-[#888]"
            style={{ background: highlighted ? "#ddf" : "#fff" }}
          >
            {ni}
          </div>
        );
      })}
    </div>
  );
}

function NoteInputBar_InScale() {
  return (
    <div class="flex-v">
      {seqNumbers(22).map((i) => {
        const ni = 21 - i - 7;
        const highlighted = ni % 7 === 0;
        return (
          <div
            class="w-[60px] h-[20px] border border-[#888] flex-c text-[#888]"
            style={{ background: highlighted ? "#ddf" : "#fff" }}
          >
            {ni}
          </div>
        );
      })}
    </div>
  );
}

function NoteInputBar_Narrow1() {
  return (
    <div class="flex-v">
      {seqNumbers(13).map((i) => {
        const ni = (12 - i - 4) * 3;
        const highlighted = ni % 12 === 0;
        return (
          <div
            class="w-[60px] h-[20px] border border-[#888] flex-c text-[#888]"
            style={{ background: highlighted ? "#ddf" : "#fff" }}
          >
            {ni}
          </div>
        );
      })}
    </div>
  );
}

function NoteInputBar_Narrow2() {
  return (
    <div class="flex-v">
      {seqNumbers(10).map((i) => {
        const ni = (9 - i - 3) * 4;
        const highlighted = ni % 12 === 0;
        return (
          <div
            class="w-[60px] h-[20px] border border-[#888] flex-c text-[#888]"
            style={{ background: highlighted ? "#ddf" : "#fff" }}
          >
            {ni}
          </div>
        );
      })}
    </div>
  );
}

function NoteInputBar_Narrow3() {
  return (
    <div class="flex-v">
      {seqNumbers(7).map((i) => {
        const ni = (6 - i - 2) * 6;
        const highlighted = ni % 12 === 0;
        return (
          <div
            class="w-[60px] h-[20px] border border-[#888] flex-c text-[#888]"
            style={{ background: highlighted ? "#ddf" : "#fff" }}
          >
            {ni}
          </div>
        );
      })}
    </div>
  );
}

function MainUi() {
  return (
    <div class="w-dvw h-dvh flex-c gap-2">
      <NoteInputBar_Normal />
      <NoteInputBar_InScale />
      <NoteInputBar_Narrow1 />
      <NoteInputBar_Narrow2 />
      <NoteInputBar_Narrow3 />
    </div>
  );
}

function App() {
  return <MainUi />;
}

mountAppRoot(() => <App />);
