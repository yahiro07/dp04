import { CSSProperties, useState } from "react";
import { createStore } from "snap-store";
import { flexAligned, npx } from "@/ui/styling/styling-utils";
import { startDragSession } from "@/utils/drag-session";
import { mountAppRoot } from "@/utils/mount-app-root";
import { clamp } from "@/utils/number-utils";

export type Note = {
  id: string;
  relNoteNumber: number;
  position: number;
  duration: number;
  lane: number;
};

type DraftNote = Note & {
  pointerId: number;
};

const defaultNotes: Note[] = [
  { id: "n0", lane: 2, relNoteNumber: 0, position: 0, duration: 2 },
  { id: "n1", lane: 1, relNoteNumber: 4, position: 2, duration: 2 },
  { id: "n3", lane: 1, relNoteNumber: 6, position: 4, duration: 4 },
  { id: "n2", lane: 0, relNoteNumber: 8, position: 4, duration: 4 },
];

const store = createStore<{ notes: Note[]; draftNote: DraftNote | null }>({
  notes: defaultNotes,
  draftNote: null,
});

const sortNotes = (notes: Note[]) =>
  [...notes].sort((a, b) => {
    if (a.lane !== b.lane) {
      return a.lane - b.lane;
    }
    if (a.position !== b.position) {
      return a.position - b.position;
    }
    return a.duration - b.duration;
  });

const configs = {
  minPitch: -12,
  maxPitch: 12,
  pitchDragStepPx: 24,
  clickMoveThresholdPx: 6,
  stepCount: 16,
  cellWidthPx: 60,
  defaultInsertedPitch: 0,
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
        lane: draftNote.lane,
        position: draftNote.position,
        duration: draftNote.duration,
        relNoteNumber: draftNote.relNoteNumber,
      };
      return sortNotes([...prev, nextNote]);
    });
    store.mutations.setDraftNote(() => null);
  },
};

type LaneCellBox = {
  stepWidth: number;
  note?: Note;
};

const useLaneCellBoxes = (lane: number): LaneCellBox[] => {
  const { notes, draftNote } = store.useSnapshot();
  const laneNotes = sortNotes(
    notes
      .filter((n) => n.lane === lane)
      .concat(draftNote && draftNote.lane === lane ? [draftNote] : []),
  );
  const boxes: LaneCellBox[] = [];
  let pos = 0;
  let noteIndex = 0;
  while (pos < configs.stepCount) {
    const note = laneNotes[noteIndex];
    if (note && note.position === pos) {
      boxes.push({
        stepWidth: note.duration,
        note,
      });
      noteIndex++;
      pos += note.duration;
    } else {
      boxes.push({
        stepWidth: 1,
        note: undefined,
      });
      pos++;
    }
  }
  return boxes;
};

const getMaxDurationForPosition = (
  notes: Note[],
  lane: number,
  position: number,
) => {
  const nextNote = notes
    .filter((note) => note.lane === lane && note.position > position)
    .sort((a, b) => a.position - b.position)[0];
  const laneEnd = nextNote ? nextNote.position : configs.stepCount;
  return Math.max(1, laneEnd - position);
};

function styleLaneCell(
  stepWidth: number,
  variant: "empty" | "note" | "draft",
): CSSProperties {
  const background =
    variant === "draft" ? "#f8d66d" : variant === "note" ? "#aae" : "#fff";
  return {
    width: npx(stepWidth * configs.cellWidthPx),
    height: npx(60),
    border: "solid 1px #ccc",
    background,
    ...flexAligned(),
    paddingLeft: npx(8),
  };
}

const LaneCell = ({ note }: { note: Note }) => {
  const [dragging, setDragging] = useState(false);

  const handlePointerDown = (e0: React.PointerEvent) => {
    const dragState = {
      startPitch: note.relNoteNumber,
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
        if (dist < configs.clickMoveThresholdPx) {
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

const DummyLaneCell = ({
  lane,
  position,
}: {
  lane: number;
  position: number;
}) => {
  const { notes } = store.useSnapshot();
  const [dragging, setDragging] = useState(false);

  const handlePointerDown = (e0: React.PointerEvent) => {
    const cellLeft = e0.currentTarget.getBoundingClientRect().left;
    const maxDuration = getMaxDurationForPosition(notes, lane, position);
    const draftNoteId = crypto.randomUUID();

    actions.setDraftNote({
      id: `draft-${draftNoteId}`,
      pointerId: e0.pointerId,
      lane,
      position,
      duration: 1,
      relNoteNumber: configs.defaultInsertedPitch,
    });

    startDragSession(e0, {
      onMove({ position: currentPosition }) {
        const localX = currentPosition.x - cellLeft;
        const duration = clamp(
          Math.floor(localX / configs.cellWidthPx) + 1,
          1,
          maxDuration,
        );
        store.mutations.setDraftNote((currentDraft) => {
          if (!currentDraft || currentDraft.pointerId !== e0.pointerId) {
            return currentDraft;
          }
          return {
            ...currentDraft,
            duration,
          };
        });
      },
      onUp() {
        actions.commitDraftNote();
        setDragging(false);
      },
      onCancel() {
        actions.setDraftNote(null);
        setDragging(false);
      },
    });
    setDragging(true);
  };

  return (
    <div
      style={{
        ...styleLaneCell(1, "empty"),
        cursor: dragging ? "ew-resize" : "cell",
        touchAction: "none",
        userSelect: "none",
      }}
      onPointerDown={handlePointerDown}
    />
  );
};

const SequenceLane = ({ lane }: { lane: number }) => {
  const cellBoxes = useLaneCellBoxes(lane);
  let position = 0;
  return (
    <div className="flex">
      {cellBoxes.map((box, i) => {
        const cell = box.note ? (
          <LaneCell key={i.toString()} note={box.note} />
        ) : (
          <DummyLaneCell key={i.toString()} lane={lane} position={position} />
        );
        position += box.stepWidth;
        return cell;
      })}
    </div>
  );
};

const SequenceEditorView = () => {
  return (
    <div>
      <SequenceLane lane={0} />
      <SequenceLane lane={1} />
      <SequenceLane lane={2} />
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
