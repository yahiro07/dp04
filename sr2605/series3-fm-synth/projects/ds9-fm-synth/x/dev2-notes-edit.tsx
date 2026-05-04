/* @refresh reload */

import { clampValue, linerInterpolate } from "@lib/ax/number-utils";
import { mountAppRoot } from "@lib/ax-solid/mount-app-root";
import { startDragSession } from "@lib/mo/drag-session";
import { npx } from "@lib/mo/styling-utils";
import { createSignal } from "solid-js";

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
      class="w-[80px] h-[260px] border border-[#888] relative cursor-pointer"
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
    <div class="w-dvw h-dvh flex-c">
      <EditNoteInputBar_Narrow1 />
      <EditNoteInputBar_Narrow1 />
      <EditNoteInputBar_Narrow1 />
      <EditNoteInputBar_Narrow1 />
      <EditNoteInputBar_Narrow1 />
      <EditNoteInputBar_Narrow1 />
      <EditNoteInputBar_Narrow1 />
      <EditNoteInputBar_Narrow1 />
    </div>
  );
}

function App() {
  return <MainUi />;
}

mountAppRoot(() => <App />);
