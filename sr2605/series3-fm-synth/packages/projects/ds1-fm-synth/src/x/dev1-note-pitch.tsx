/* @refresh reload */

import { seqNumbers } from "@my/lib/ax/array-utils";
import { clampValue, linerInterpolate } from "@my/lib/ax/number-utils";
import { mountAppRoot } from "@my/lib/ax-solid/mount-app-root";
import { startDragSession } from "@my/lib/mo/drag-session";
import { npx } from "@my/lib/mo/styling-utils";
import { createSignal } from "solid-js";

const targetNotes = [0, 4, 7];

function NoteInputBar_Normal() {
  return (
    <div class="flex-v">
      {seqNumbers(37).map((i) => {
        const ni = 36 - i - 12;
        const highlighted = ni % 12 === 0;
        const noteHighlighted = targetNotes.includes(ni);
        return (
          <div class="flex-h">
            <div
              class="w-[60px] h-[20px] border border-[#888] flex-c text-[#888]"
              style={{ background: highlighted ? "#ddf" : "#fff" }}
            >
              {ni}
            </div>
            <div
              class="w-[60px] h-[20px] border border-[#888] flex-c text-[#888]"
              style={{ background: noteHighlighted ? "#cfc" : "#fff" }}
            />
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
        const targetNotesInScale = [0, 2, 4];
        const noteHighlighted = targetNotesInScale.includes(ni);
        return (
          <div class="flex-h">
            <div
              class="w-[60px] h-[20px] border border-[#888] flex-c text-[#888]"
              style={{ background: highlighted ? "#ddf" : "#fff" }}
            >
              {ni}
            </div>
            <div
              class="w-[60px] h-[20px] border border-[#888] flex-c text-[#888]"
              style={{ background: noteHighlighted ? "#cfc" : "#fff" }}
            />
          </div>
        );
      })}
    </div>
  );
}

function NoteInputBar_Narrow1() {
  return (
    <div class="flex-h">
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
      <div class="w-[60px] h-[260px] border border-[#888] relative">
        {targetNotes.map((ni) => {
          const ypos = 8 * 20 - ni * (20 / 3);
          return (
            <div
              class="absolute w-[60px] h-[20px] border border-[#888] bg-[#cfc] flex-ha pl-1 text-[#888]"
              style={{ top: `${ypos}px` }}
            >
              {ni}
            </div>
          );
        })}
      </div>
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

function EditNoteInputBar_Narrow1() {
  const [state, setState] = createSignal({
    tmpNoteNumber: 0,
  });

  const helpers = {
    yToNoteNumber(y: number) {
      return Math.round(linerInterpolate(y, 0, 260, 24, -12, true));
    },
    noteNumberToY(ni: number) {
      return linerInterpolate(ni, -12, 24, 260, 0);
    },
  };
  const vm = {
    handlePointerDown(e: PointerEvent) {
      let startNoteNumber: number;

      startDragSession(e, {
        onDown(e) {
          const ni = helpers.yToNoteNumber(e.position.y);
          setState({ tmpNoteNumber: ni });
          startNoteNumber = ni;
        },
        onMove(e) {
          const yShift = Math.round(
            -(e.position.y - e.originalPosition.y) / (20 / 3),
          );
          const ni = clampValue(startNoteNumber + yShift, -12, 24);
          setState({ tmpNoteNumber: ni });
        },
      });
    },
    getTempNoteNumberY() {
      return helpers.noteNumberToY(state().tmpNoteNumber);
    },
  };

  return (
    <div
      class="w-[60px] h-[260px] border border-[#888] relative cursor-pointer"
      onPointerDown={vm.handlePointerDown}
    >
      <div
        class="absolute w-full border-b border-[#ccc]"
        style={{
          left: 0,
          top: npx(helpers.noteNumberToY(12)),
          transform: "translateY(-50%)",
        }}
      />
      <div
        class="absolute w-full border-b border-[#ccc]"
        style={{
          left: 0,
          top: npx(helpers.noteNumberToY(0)),
          transform: "translateY(-50%)",
        }}
      />

      <div
        class="absolute w-full h-[20px] flex-ha pl-1 text-[#888] border border-[#888] bg-[#cfcc]"
        style={{
          left: 0,
          top: npx(vm.getTempNoteNumberY()),
          transform: "translateY(-50%)",
        }}
      >
        {state().tmpNoteNumber}
      </div>
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
      <EditNoteInputBar_Narrow1 />
    </div>
  );
}

function App() {
  return <MainUi />;
}

mountAppRoot(() => <App />);
