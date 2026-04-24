import { CSSProperties, useState } from "react";
import { createStore } from "snap-store";
import { flexAligned, npx } from "@/ui/styling/styling-utils";
import { mountAppRoot } from "@/utils/mount-app-root";

export type Note = {
  id: string;
  relNoteNumber: number;
  position: number;
  duration: number;
  lane: number;
};

const defaultNotes: Note[] = [
  { id: "n0", lane: 2, relNoteNumber: 0, position: 0, duration: 2 },
  { id: "n1", lane: 1, relNoteNumber: 4, position: 2, duration: 2 },
  { id: "n3", lane: 1, relNoteNumber: 6, position: 4, duration: 4 },
  { id: "n2", lane: 0, relNoteNumber: 8, position: 4, duration: 4 },
];

const store = createStore<{ notes: Note[] }>({
  notes: defaultNotes,
});

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const configs = {
  minPitch: -12,
  maxPitch: 12,
  pitchDragStepPx: 24,
  clickMoveThresholdPx: 6,
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
};

type LaneCellBox = {
  stepWidth: number;
  note?: Note;
};

const useLaneCellBoxes = (lane: number): LaneCellBox[] => {
  const { notes } = store.useSnapshot();
  const laneNotes = notes.filter((n) => n.lane === lane);
  const boxes: LaneCellBox[] = [];
  let pos = 0;
  let noteIndex = 0;
  while (pos < 16) {
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

function styleLaneCell(stepWidth: number, hasNote: boolean): CSSProperties {
  return {
    width: npx(stepWidth * 60),
    height: npx(60),
    border: "solid 1px #ccc",
    background: hasNote ? "#aae" : "#fff",
    ...flexAligned(),
    paddingLeft: npx(8),
  };
}

const LaneCell = ({ note }: { note: Note }) => {
  const [dragging, setDragging] = useState(false);

  const handlePointerDown = (e0: React.PointerEvent) => {
    const el = e0.currentTarget as HTMLDivElement;
    const dragState = {
      startY: e0.clientY,
      startPitch: note.relNoteNumber,
      hasDragged: false,
    };
    const onMove = (e: PointerEvent) => {
      const deltaY = dragState.startY - e.clientY;
      if (Math.abs(deltaY) >= configs.clickMoveThresholdPx) {
        dragState.hasDragged = true;
      }
      const pitchOffset = Math.round(deltaY / configs.pitchDragStepPx);
      actions.setNotePitch(note.id, dragState.startPitch + pitchOffset);
    };
    const cleanup = () => {
      el.releasePointerCapture(e0.pointerId);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerCancel);
      setDragging(false);
    };
    const onPointerUp = () => {
      cleanup();
      if (!dragState.hasDragged) {
        actions.removeNote(note.id);
      }
    };
    const onPointerCancel = () => {
      cleanup();
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerCancel);
    el.setPointerCapture(e0.pointerId);
    setDragging(true);
  };

  return (
    <div
      style={{
        ...styleLaneCell(note.duration, true),
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

const DummyLaneCell = () => {
  return <div style={styleLaneCell(1, false)} />;
};

const SequenceLane = ({ lane }: { lane: number }) => {
  const cellBoxes = useLaneCellBoxes(lane);
  return (
    <div className="flex">
      {cellBoxes.map((box, i) => {
        return box.note ? (
          <LaneCell key={i.toString()} note={box.note} />
        ) : (
          <DummyLaneCell key={i.toString()} />
        );
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
