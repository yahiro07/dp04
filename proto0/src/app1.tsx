import { mountAppRoot } from "@/utils/mount-app-root";
import "./styling/page.css";
import "./styling/utility-classes.css";
import { useEffect } from "react";
import { createStore } from "snap-store";
import {
  MidiKeyboardInputEvent,
  setupMidiKeyboardInput,
} from "@/midi-keyboard-input";

const GRID_COLS = 16;
const GRID_ROWS = 16;
const MAX_STEP = GRID_COLS * GRID_ROWS;
const CELL_PX = 18;
const GRID_PX = GRID_COLS * CELL_PX;
const NOTE_BORDER_COLOR = "#2350a8";
const NOTE_FILL_COLOR = "#bcd5ff";

const synth = new (
  window as unknown as {
    WebAudioTinySynth: new () => { send: (data: number[]) => void };
  }
).WebAudioTinySynth();

const synthActions = {
  noteOn(noteNumber: number, velocity: number) {
    synth.send([0x90, noteNumber, velocity]);
  },
  noteOff(noteNumber: number) {
    synth.send([0x80, noteNumber, 0]);
  },
};

const NI_NONE = 128;
const NI_TIE = 129;

type Note = {
  noteNumber: number;
  stepPosition: number;
  stepDuration: number;
};

type NoteRect = {
  key: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

const store = createStore<{
  cursorPos: number;
  cursorDuration: number;
  editMode: boolean;
  stepCells: number[];
  notes: Note[];
}>({
  cursorPos: 0,
  cursorDuration: 2,
  editMode: false,
  stepCells: Array(MAX_STEP).fill(NI_NONE),
  notes: [],
});

const durationValues = [4, 2, 1];

function normalizeDuration(stepPosition: number, stepDuration: number) {
  return Math.max(1, Math.min(stepDuration, MAX_STEP - stepPosition));
}

function getNoteStartIndex(stepCells: number[], stepIndex: number) {
  let start = stepIndex;
  while (start > 0 && stepCells[start] === NI_TIE) {
    start -= 1;
  }
  return start;
}

function clearNoteAtCell(stepCells: number[], stepIndex: number) {
  if (stepCells[stepIndex] === NI_NONE) return;
  const start = getNoteStartIndex(stepCells, stepIndex);
  if (stepCells[start] >= NI_NONE) return;
  stepCells[start] = NI_NONE;
  for (let i = start + 1; i < MAX_STEP && stepCells[i] === NI_TIE; i += 1) {
    stepCells[i] = NI_NONE;
  }
}

function clearNotesOverlapping(
  stepCells: number[],
  stepPosition: number,
  stepDuration: number,
) {
  const end = Math.min(stepPosition + stepDuration, MAX_STEP);
  const visited = new Set<number>();
  for (let i = stepPosition; i < end; i += 1) {
    if (stepCells[i] === NI_NONE) continue;
    const start = getNoteStartIndex(stepCells, i);
    if (visited.has(start)) continue;
    visited.add(start);
    clearNoteAtCell(stepCells, start);
  }
}

function collectNotesFromStepCells(stepCells: number[]) {
  const collected: Note[] = [];
  for (let i = 0; i < MAX_STEP; i += 1) {
    const value = stepCells[i];
    if (value >= NI_NONE) continue;
    let duration = 1;
    while (i + duration < MAX_STEP && stepCells[i + duration] === NI_TIE) {
      duration += 1;
    }
    collected.push({
      noteNumber: value,
      stepPosition: i,
      stepDuration: duration,
    });
    i += duration - 1;
  }
  return collected;
}

function normalizeNotes(notes: Note[]) {
  return notes
    .map((note) => ({
      ...note,
      stepDuration: normalizeDuration(note.stepPosition, note.stepDuration),
    }))
    .sort((a, b) => a.stepPosition - b.stepPosition);
}

const editSC = {
  addNote(noteNumber: number) {
    const { cursorPos, cursorDuration, stepCells } = store.state;
    const next = [...stepCells];
    const duration = normalizeDuration(cursorPos, cursorDuration);
    clearNotesOverlapping(next, cursorPos, duration);
    next[cursorPos] = noteNumber;
    for (let offset = 1; offset < duration; offset += 1) {
      next[cursorPos + offset] = NI_TIE;
    }
    store.setStepCells(next);
  },
  addTie() {
    const { cursorPos, cursorDuration, stepCells } = store.state;
    if (cursorPos <= 0 || cursorPos >= MAX_STEP) return;
    const next = [...stepCells];
    const duration = normalizeDuration(cursorPos, cursorDuration);
    const prevStart = getNoteStartIndex(next, cursorPos - 1);
    if (next[prevStart] >= NI_NONE) return;
    for (let i = cursorPos; i < cursorPos + duration; i += 1) {
      if (next[i] < NI_NONE && getNoteStartIndex(next, i) !== prevStart) {
        clearNoteAtCell(next, i);
      }
    }
    for (let i = cursorPos; i < cursorPos + duration; i += 1) {
      next[i] = NI_TIE;
    }
    store.setStepCells(next);
  },
  addRest() {
    const { cursorPos, stepCells } = store.state;
    const next = [...stepCells];
    clearNoteAtCell(next, cursorPos);
    store.setStepCells(next);
  },
};

const editNotes = {
  addNote(noteNumber: number) {
    const { cursorPos, cursorDuration, notes } = store.state;
    const duration = normalizeDuration(cursorPos, cursorDuration);
    const noteEnd = cursorPos + duration;
    const next = notes.filter((note) => {
      const start = note.stepPosition;
      const end = note.stepPosition + note.stepDuration;
      return end <= cursorPos || noteEnd <= start;
    });
    next.push({
      noteNumber,
      stepPosition: cursorPos,
      stepDuration: duration,
    });
    store.setNotes(normalizeNotes(next));
  },
  addTie() {
    const { cursorPos, cursorDuration, notes } = store.state;
    if (cursorPos <= 0 || cursorPos >= MAX_STEP) return;
    const duration = normalizeDuration(cursorPos, cursorDuration);
    const tieEnd = cursorPos + duration;
    const prevNote = notes.find((note) => {
      const start = note.stepPosition;
      const end = note.stepPosition + note.stepDuration;
      return start <= cursorPos - 1 && cursorPos - 1 < end;
    });
    if (!prevNote) return;
    const next = notes
      .filter((note) => {
        if (note === prevNote) return true;
        const start = note.stepPosition;
        const end = note.stepPosition + note.stepDuration;
        return end <= cursorPos || tieEnd <= start;
      })
      .map((note) => {
        if (note !== prevNote) return note;
        return {
          ...note,
          stepDuration: Math.max(note.stepDuration, tieEnd - note.stepPosition),
        };
      });
    store.setNotes(normalizeNotes(next));
  },
  addRest() {
    const { cursorPos, notes } = store.state;
    const next = notes.filter((note) => {
      const start = note.stepPosition;
      const end = note.stepPosition + note.stepDuration;
      return cursorPos < start || end <= cursorPos;
    });
    store.setNotes(normalizeNotes(next));
  },
};

const uiActions = {
  shiftCursorPos(dir: -1 | 1) {
    const { cursorDuration } = store.state;
    store.setCursorPos((prev) => {
      return (prev + dir * cursorDuration + MAX_STEP) % MAX_STEP;
    });
  },
  shiftCursorPosV(dir: -1 | 1) {
    const amount = GRID_COLS;
    store.setCursorPos((prev) => {
      return (prev + dir * amount + MAX_STEP) % MAX_STEP;
    });
  },
  shiftDuration(dir: -1 | 1 = 1) {
    const { cursorDuration } = store.state;
    const idx = durationValues.indexOf(cursorDuration);
    const newIdx = (idx + dir + durationValues.length) % durationValues.length;
    store.setCursorDuration(durationValues[newIdx]);
  },
  stepForward() {
    uiActions.shiftCursorPos(1);
  },
  stepBack() {
    uiActions.shiftCursorPos(-1);
  },
  stepUp() {
    uiActions.shiftCursorPosV(-1);
  },
  stepDown() {
    uiActions.shiftCursorPosV(1);
  },
  putTie() {
    editSC.addTie();
    editNotes.addTie();
    uiActions.shiftCursorPos(1);
  },
  putRest() {
    uiActions.shiftCursorPos(1);
    editSC.addRest();
    editNotes.addRest();
  },
  toggleEditMode() {
    store.setEditMode((prev) => !prev);
  },
  handleMidiInput(e: MidiKeyboardInputEvent) {
    const { editMode } = store.state;
    if (e.type !== "note") return;

    const isOn = e.velocity > 0;
    if (isOn) {
      const ni = e.noteNumber;
      const shortCuts: Record<number, () => void> = {
        48: uiActions.stepBack,
        50: uiActions.stepForward,
        77: uiActions.putRest,
        78: uiActions.toggleEditMode,
        79: uiActions.putTie,
      };
      const shortcut = shortCuts[ni];
      if (shortcut) {
        shortcut();
        return;
      }
      if (editMode) {
        editSC.addNote(ni);
        editNotes.addNote(ni);
        uiActions.shiftCursorPos(1);
      }
      synthActions.noteOn(ni, e.velocity);
    } else {
      synthActions.noteOff(e.noteNumber);
    }
  },
};

function durationToString(d: number) {
  if (d === 1) return "/16";
  if (d === 2) return "/8";
  if (d === 4) return "/4";
  return String(d);
}

function noteToRects(note: Note, keyPrefix: string): NoteRect[] {
  const rects: NoteRect[] = [];
  const duration = normalizeDuration(note.stepPosition, note.stepDuration);
  let remaining = duration;
  let pos = note.stepPosition;
  let segmentIndex = 0;

  while (remaining > 0) {
    const row = Math.floor(pos / GRID_COLS);
    const col = pos % GRID_COLS;
    const roomInRow = GRID_COLS - col;
    const segmentDuration = Math.min(remaining, roomInRow);
    rects.push({
      key: `${keyPrefix}-${segmentIndex}`,
      left: col * CELL_PX,
      top: row * CELL_PX,
      width: segmentDuration * CELL_PX,
      height: CELL_PX,
    });
    remaining -= segmentDuration;
    pos += segmentDuration;
    segmentIndex += 1;
  }

  return rects;
}

function notesToRects(notes: Note[], keyPrefix: string) {
  return notes.flatMap((note, index) =>
    noteToRects(note, `${keyPrefix}-${index}`),
  );
}

const Button = ({
  active,
  text,
  children,
  onClick,
}: {
  active?: boolean;
  text?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-w-[40px] h-[40px]"
      css={{
        border: "solid 1px #888",
        backgroundColor: active ? "#cfc" : "#fff",
        borderRadius: "50%",
        cursor: "pointer",
      }}
    >
      {text && <span>{text}</span>}
      {children}
    </button>
  );
};

const GridLayer = () => {
  return (
    <div
      css={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#f5f5f5",
        backgroundImage: [
          `linear-gradient(to right, #d7d7d7 1px, transparent 1px)`,
          `linear-gradient(to bottom, #d7d7d7 1px, transparent 1px)`,
        ].join(","),
        backgroundSize: `${CELL_PX}px ${CELL_PX}px`,
      }}
    />
  );
};

const NoteLayer = ({ notes }: { notes: Note[] }) => {
  const rects = notesToRects(notes, "note");
  return (
    <div css={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {rects.map((rect) => {
        return (
          <div
            key={rect.key}
            css={{
              position: "absolute",
              left: `${rect.left}px`,
              top: `${rect.top}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              boxSizing: "border-box",
              border: `1px solid ${NOTE_BORDER_COLOR}`,
              backgroundColor: NOTE_FILL_COLOR,
            }}
          />
        );
      })}
    </div>
  );
};

const CursorLayer = ({
  cursorPos,
  cursorDuration,
}: {
  cursorPos: number;
  cursorDuration: number;
}) => {
  const rects = noteToRects(
    {
      noteNumber: 0,
      stepPosition: cursorPos,
      stepDuration: cursorDuration,
    },
    "cursor",
  );
  return (
    <div css={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {rects.map((rect) => {
        return (
          <div
            key={rect.key}
            css={{
              position: "absolute",
              left: `${rect.left}px`,
              top: `${rect.top}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              boxSizing: "border-box",
              border: "1px solid #00a34a",
              backgroundColor: "rgba(0, 163, 74, 0.08)",
            }}
          />
        );
      })}
    </div>
  );
};

const EditorPanel = ({
  title,
  notes,
  detail,
}: {
  title: string;
  notes: Note[];
  detail: string;
}) => {
  const { cursorPos, cursorDuration } = store.useSnapshot();
  return (
    <div className="flex-v gap-2">
      <div css={{ fontWeight: 700 }}>{title}</div>
      <div css={{ fontSize: "12px", color: "#666", minHeight: "32px" }}>
        {detail}
      </div>
      <div
        css={{
          position: "relative",
          width: `${GRID_PX}px`,
          height: `${GRID_ROWS * CELL_PX}px`,
          border: "solid 1px #888",
          overflow: "hidden",
        }}
      >
        <GridLayer />
        <NoteLayer notes={notes} />
        <CursorLayer cursorPos={cursorPos} cursorDuration={cursorDuration} />
      </div>
    </div>
  );
};

const LeftControlArea = () => {
  return (
    <div className="flex-ha">
      <div>
        <Button text="←" onClick={uiActions.stepBack} />
      </div>
      <div className="flex-v">
        <Button text="↑" onClick={uiActions.stepUp} />
        <div className="h-[40px]" />
        <Button text="↓" onClick={uiActions.stepDown} />
      </div>
      <div>
        <Button text="→" onClick={uiActions.stepForward} />
      </div>
    </div>
  );
};

const RightControlArea = () => {
  const { editMode } = store.useSnapshot();
  return (
    <div className="flex-ha">
      <div>
        <Button text="dur" onClick={() => uiActions.shiftDuration(1)} />
      </div>
      <div className="flex-v">
        <Button
          text="edit"
          active={editMode}
          onClick={uiActions.toggleEditMode}
        />
        <div className="h-[40px]" />
        <Button text="rest" onClick={uiActions.putRest} />
      </div>
      <div>
        <Button text="tie" onClick={uiActions.putTie} />
      </div>
    </div>
  );
};

const PanelBody = () => {
  return (
    <div className="flex-ha gap-4 p-5 border border-[#888] rounded-[999px]">
      <LeftControlArea />
      <RightControlArea />
    </div>
  );
};

const DebugSection = () => {
  const st = store.useSnapshot();
  const stepCellNotes = collectNotesFromStepCells(st.stepCells);
  const normalizedNotes = normalizeNotes(st.notes);
  const isEquivalent =
    JSON.stringify(stepCellNotes) === JSON.stringify(normalizedNotes);

  return (
    <div className="flex-v gap-1" css={{ fontSize: "14px" }}>
      <div>pos: {st.cursorPos}</div>
      <div>duration: {st.cursorDuration}</div>
      <div>durationStr: {durationToString(st.cursorDuration)}</div>
      <div>stepCells notes: {stepCellNotes.length}</div>
      <div>notes entries: {normalizedNotes.length}</div>
      <div>equal: {isEquivalent ? "yes" : "no"}</div>
    </div>
  );
};

const ComparisonSection = () => {
  const st = store.useSnapshot();
  const stepCellNotes = collectNotesFromStepCells(st.stepCells);
  const normalizedNotes = normalizeNotes(st.notes);
  return (
    <div className="flex-v gap-4">
      <div
        css={{
          maxWidth: `${GRID_PX * 2 + 32}px`,
          fontSize: "14px",
          lineHeight: 1.6,
        }}
      >
        `stepCells` は1ステップごとの編集が直感的で、`notes`
        は長さを持つ実ノートの管理がしやすいです。どちらも同じ入力で更新されるので、画面で挙動差を見比べられます。
      </div>
      <div className="flex-hs gap-4">
        <EditorPanel
          title="stepCells"
          notes={stepCellNotes}
          detail="各16分音符セルに note / tie / none を保持する方式。ステップ編集は単純です。"
        />
        <EditorPanel
          title="notes"
          notes={normalizedNotes}
          detail="開始位置と長さを持つノート配列。表示・解析・将来の再生処理に自然に繋げやすいです。"
        />
      </div>
    </div>
  );
};

const ShortcutGuide = () => {
  return (
    <div className="flex-v gap-1" css={{ fontSize: "13px", color: "#555" }}>
      <div>MIDI shortcut: C3=←, D3=→, F5=edit, F4=rest, G5=tie</div>
      <div>
        編集モード中にそれ以外のノートを弾くと、現在カーソル位置へステップ入力します。
      </div>
    </div>
  );
};

const App = () => {
  useEffect(() => {
    void setupMidiKeyboardInput(uiActions.handleMidiInput);
  }, []);

  return (
    <div
      className="flex-vc gap-6"
      css={{ width: "100vw", minHeight: "100vh", padding: "32px" }}
    >
      <DebugSection />
      <PanelBody />
      <ShortcutGuide />
      <ComparisonSection />
    </div>
  );
};

mountAppRoot(<App />, "app");
