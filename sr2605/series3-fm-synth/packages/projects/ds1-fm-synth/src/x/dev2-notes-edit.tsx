/* @refresh reload */

import { seqNumbers } from "@my/lib/ax/array-utils";
import { clampValue, linearInterpolate } from "@my/lib/ax/number-utils";
import { mountAppRoot } from "@my/lib/ax-solid/mount-app-root";
import { startDragSession } from "@my/lib/mo/drag-session";
import { npx } from "@my/lib/mo/styling-utils";
import { createSignal, Show } from "solid-js";

function EditNoteInputBar_Narrow1() {
  const [state, setState] = createSignal({
    tmpNoteNumber: 0,
  });

  const helpers = {
    yToNoteNumber(y: number) {
      return Math.round(linearInterpolate(y, 0, 260, 24, -12, true));
    },
    noteNumberToY(ni: number) {
      return linearInterpolate(ni, -12, 24, 260, 0);
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

const Editor1 = () => {
  return (
    <div class="flex-h">
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
};

const Editor2 = () => {
  type Note = {
    noteNumber: number;
    position: number;
    duration: number;
  };
  type State = {
    notes: Note[];
    tmpNote: Note | null;
  };
  const [state, setState] = createSignal<State>({
    notes: [],
    tmpNote: null,
  });

  const helpers = {
    yToNoteNumber(y: number) {
      return Math.round(linearInterpolate(y, 0, 260, 24, -12, true));
    },
    noteNumberToY(ni: number) {
      return linearInterpolate(ni, -12, 24, 260, 0);
    },
    xToNotePosition(x: number) {
      return Math.floor(x / (640 / 32));
    },
    notePositionToX(p: number) {
      return p * (640 / 32);
    },
  };
  const readers = {
    findNoteAt(position: number, noteNumber: number) {
      return state().notes.find(
        (note) =>
          note.position <= position &&
          position < note.position + note.duration &&
          note.noteNumber === noteNumber,
      );
    },
  };
  const actions = {
    patchState(attrs: Partial<State>) {
      setState((prev) => ({ ...prev, ...attrs }));
    },
  };
  const vm = {
    handlePointerDown(e: PointerEvent) {
      let startNoteNumber: number;
      let startNotePosition: number;

      startDragSession(e, {
        onDown(e) {
          const ni = helpers.yToNoteNumber(e.position.y);
          const pos = helpers.xToNotePosition(e.position.x);
          const note = readers.findNoteAt(pos, ni);
          if (note) {
            //edit note
            actions.patchState({
              notes: state().notes.filter((n) => n !== note),
              tmpNote: note,
            });
          } else {
            //create new note
            actions.patchState({
              tmpNote: {
                noteNumber: ni,
                position: pos,
                duration: 1,
              },
            });
          }

          startNoteNumber = ni;
          startNotePosition = pos;
        },
        onMove(e) {
          const yShift = Math.round(
            -(e.position.y - e.originalPosition.y) / (20 / 3),
          );
          const ni = clampValue(startNoteNumber + yShift, -12, 24);
          const pos = helpers.xToNotePosition(e.position.x);
          const newDuration = pos - startNotePosition + 1;
          actions.patchState({
            tmpNote: {
              noteNumber: ni,
              position: state().tmpNote!.position,
              duration: newDuration,
            },
          });
        },
        onUp() {
          const tmpNote = state().tmpNote;
          if (!tmpNote) return;
          if (tmpNote.duration > 0) {
            setState((prev) => {
              return {
                ...prev,
                notes: [...prev.notes, tmpNote],
                tmpNote: null,
              };
            });
          } else {
            setState((prev) => ({ ...prev, tmpNote: null }));
          }
        },
      });
    },
    getTempNoteNumberY() {
      return helpers.noteNumberToY(state().tmpNote?.noteNumber ?? 0);
    },
    getTempNotePositionX() {
      return helpers.notePositionToX(state().tmpNote?.position ?? 0);
    },
    getTempNoteDurationWidth() {
      return (state().tmpNote?.duration ?? 0) * (640 / 32);
    },
  };

  return (
    <div class="border border-[#aaa]">
      <div
        class="w-[640px] h-[260px] relative cursor-pointer"
        onPointerDown={vm.handlePointerDown}
      >
        {seqNumbers(4).map((i) => {
          return (
            <div
              class="absolute bg-[#f8f8f8]"
              style={{
                top: 0,
                left: npx(i * 160 + 80),
                width: npx(80),
                height: "100%",
              }}
            />
          );
        })}
        {seqNumbers(2).map((i) => (
          <div
            class="absolute w-full border-b border-[#ddd]"
            style={{
              left: 0,
              top: npx(helpers.noteNumberToY(i * 12)),
              transform: "translateY(-50%)",
            }}
          />
        ))}
        {state().notes.map((note) => {
          return (
            <div
              class="absolute flex-ha text-[#888] border border-[#888] bg-[#cfcc]"
              style={{
                left: npx(helpers.notePositionToX(note.position)),
                top: npx(helpers.noteNumberToY(note.noteNumber)),
                width: npx(note.duration * (640 / 32)),
                height: "20px",
                transform: "translateY(-50%)",
              }}
            >
              {note.noteNumber}
            </div>
          );
        })}
        <Show when={!!state().tmpNote && state().tmpNote!.duration > 0}>
          <div
            class="absolute flex-ha text-[#888] border border-[#888] bg-[#cfcc]"
            style={{
              left: npx(vm.getTempNotePositionX()),
              top: npx(vm.getTempNoteNumberY()),
              width: npx(vm.getTempNoteDurationWidth()),
              height: "20px",
              transform: "translateY(-50%)",
            }}
          >
            {state().tmpNote?.noteNumber}
          </div>
        </Show>
      </div>
    </div>
  );
};
function MainUi() {
  return (
    <div class="w-dvw h-dvh flex-vc gap-6">
      <Editor1 />
      <Editor2 />
    </div>
  );
}

function App() {
  return <MainUi />;
}

mountAppRoot(() => <App />);
