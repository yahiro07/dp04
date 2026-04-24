import { CSSProperties, useState } from "react";
import { createStore } from "snap-store";
import { GridBackground } from "@/ui/organisms/grid-background";
import { flexHorizontal, npx } from "@/ui/styling/styling-utils";
import { startDragSession } from "@/utils/drag-session";
import { mountAppRoot } from "@/utils/mount-app-root";
import { clamp } from "@/utils/number-utils";

export type Note = {
  id: string;
  relNoteNumber: number;
  position: number;
  duration: number;
};

type DraftNote = Note & {
  pointerId: number;
};

const defaultNotes: Note[] = [
  { id: "n0", relNoteNumber: 0, position: 0, duration: 2 },
  { id: "n1", relNoteNumber: 4, position: 2, duration: 2 },
  { id: "n2", relNoteNumber: 8, position: 4, duration: 4 },
  { id: "n3", relNoteNumber: 6, position: 4, duration: 4 },
  { id: "n4", relNoteNumber: 0, position: 8, duration: 8 },
];

const store = createStore<{ notes: Note[]; draftNote: DraftNote | null }>({
  notes: defaultNotes,
  draftNote: null,
});

const sortNotes = (notes: Note[]) =>
  [...notes].sort((a, b) => {
    if (a.position !== b.position) {
      return a.position - b.position;
    }
    return a.duration - b.duration;
  });

const configs = {
  minPitch: -18,
  maxPitch: 18,
  pitchDragStepPx: 7,
  clickMoveThresholdPx: 6,
  stepCount: 16,
  cellWidthPx: 40,
  noteHeight: 40,
  editAreaHeight: 220,
};

const actions = {
  setNotePitch(id: string, pitch: number) {
    store.mutations.setNotes((prev) => {
      return prev.map((note) => {
        if (note.id === id) {
          return {
            ...note,
            relNoteNumber: clamp(pitch, configs.minPitch, configs.maxPitch),
          };
        }
        return note;
      });
    });
  },
  removeNote(id: string) {
    store.mutations.setNotes((prev) => {
      return prev.filter((note) => note.id !== id);
    });
  },
  setDraftNote(draftNote: DraftNote | null) {
    store.mutations.setDraftNote(() => draftNote);
  },
  commitDraftNote() {
    const { draftNote } = store.state;
    if (!draftNote) {
      return;
    }
    store.mutations.setNotes((prev) => {
      const nextNote: Note = {
        id: crypto.randomUUID(),
        position: draftNote.position,
        duration: draftNote.duration,
        relNoteNumber: draftNote.relNoteNumber,
      };
      return sortNotes([...prev, nextNote]);
    });
    store.mutations.setDraftNote(() => null);
  },
};

function styleLaneCell(
  stepWidth: number,
  variant: "empty" | "note" | "draft",
): CSSProperties {
  const background =
    variant === "draft" ? "#f8d66d" : variant === "note" ? "#aaea" : "#fff";
  return {
    width: npx(stepWidth * configs.cellWidthPx),
    height: npx(configs.noteHeight),
    border: "solid 1px #ccc",
    background,
    ...flexHorizontal(),
    paddingLeft: npx(8),
  };
}

const LaneCell = ({ note }: { note: Note }) => {
  const [dragging, setDragging] = useState(false);

  const handlePointerDown = (e0: React.PointerEvent) => {
    const dragState = {
      startPitch: note.relNoteNumber,
      startTime: Date.now(),
    };
    startDragSession(e0, {
      onMove({ position, originalPosition }) {
        const deltaY = originalPosition.y - position.y;
        const pitchOffset = Math.round(deltaY / configs.pitchDragStepPx);
        actions.setNotePitch(note.id, dragState.startPitch + pitchOffset);
      },
      onUp({ position, originalPosition }) {
        const dist = Math.hypot(
          originalPosition.x - position.x,
          originalPosition.y - position.y,
        );
        const elapsed = Date.now() - dragState.startTime;
        if (dist < configs.clickMoveThresholdPx && elapsed < 200) {
          actions.removeNote(note.id);
        }
        setDragging(false);
      },
      onCancel() {
        setDragging(false);
      },
    });
    setDragging(true);
  };

  return (
    <div
      style={{
        ...styleLaneCell(
          note.duration,
          note.id.startsWith("draft-") ? "draft" : "note",
        ),
        position: "absolute",
        left: npx(note.position * configs.cellWidthPx),
        top: npx(
          configs.editAreaHeight / 2 -
            note.relNoteNumber * 5 -
            configs.noteHeight / 2,
        ),
        cursor: dragging ? "ns-resize" : "grab",
        touchAction: "none",
        userSelect: "none",
      }}
      onPointerDown={handlePointerDown}
    >
      {note.relNoteNumber}
    </div>
  );
};

const SequenceEditorView = () => {
  const { notes } = store.useSnapshot();
  return (
    <div
      className="relative"
      style={{
        width: npx(configs.stepCount * configs.cellWidthPx),
        height: npx(configs.editAreaHeight),
      }}
    >
      <GridBackground
        nx={configs.stepCount}
        ny={7}
        width={configs.stepCount * configs.cellWidthPx}
        height={configs.editAreaHeight}
        bgAlterStrideX={4}
      />
      {notes.map((note) => (
        <LaneCell key={note.id} note={note} />
      ))}
    </div>
  );
};

const App = () => {
  return (
    <div className="w-dvw h-dvh flex-c">
      <SequenceEditorView />
    </div>
  );
};

mountAppRoot(<App />, "app");
