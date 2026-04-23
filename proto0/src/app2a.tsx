import { mountAppRoot } from "@/utils/mount-app-root";
import "./styling/page.css";
import "./styling/utility-classes.css";
import { useEffect } from "react";
import { createStore } from "snap-store";
import {
  MidiKeyboardInputEvent,
  setupMidiKeyboardInput,
} from "@/midi-keyboard-input";
import { seqNumbers } from "@/utils/array-utils";

const configs = {
  maxStep: 16 * 16,
};

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

enum SpecialNotes {
  None = 128,
  Tie = 129,
}

const store = createStore<{
  cursorPos: number;
  cursorDuration: number;
  editMode: boolean;
  stepCells: number[];
}>({
  cursorPos: 0,
  cursorDuration: 2,
  editMode: false,
  stepCells: Array(configs.maxStep).fill(SpecialNotes.None),
});

const durationValues = [4, 2, 1];

const stepCellsMutations = {
  putNote(
    stepCells: number[],
    noteNumber: number,
    stepPosition: number,
    stepDuration: number,
  ) {
    const newCells = [...stepCells];
    newCells[stepPosition] = noteNumber;
    for (let i = stepPosition + 1; i < stepPosition + stepDuration; i++) {
      newCells[i] = SpecialNotes.Tie;
    }
    return newCells;
  },
};

const editCoreActions = {
  putNote(noteNumber: number) {
    const { cursorPos, cursorDuration } = store.state;
    store.mutations.setStepCells((prev) => {
      return stepCellsMutations.putNote(
        prev,
        noteNumber,
        cursorPos,
        cursorDuration,
      );
    });
  },
  putRest() {
    editCoreActions.putNote(SpecialNotes.None);
  },
  putTie() {
    editCoreActions.putNote(SpecialNotes.Tie);
  },
};

const uiActions = {
  shiftCursorPos(dir: -1 | 1) {
    const { maxStep } = configs;
    const { cursorDuration } = store.state;
    store.mutations.setCursorPos((prev) => {
      return (prev + dir * cursorDuration + maxStep) % maxStep;
    });
  },
  shiftCursorPosV(dir: -1 | 1) {
    const amount = 16;
    const { maxStep } = configs;
    store.mutations.setCursorPos((prev) => {
      return (prev + dir * amount + maxStep) % maxStep;
    });
  },
  shiftDuration(dir: -1 | 1 = 1) {
    const { cursorDuration } = store.state;
    const idx = durationValues.indexOf(cursorDuration);
    const newIdx = (idx + dir + durationValues.length) % durationValues.length;
    store.mutations.setCursorDuration(durationValues[newIdx]);
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
    editCoreActions.putTie();
    uiActions.shiftCursorPos(1);
  },
  putRest() {
    editCoreActions.putRest();
    uiActions.shiftCursorPos(1);
  },
  toggleEditMode() {
    store.mutations.toggleEditMode();
  },
  handleMidiInput(e: MidiKeyboardInputEvent) {
    const { editMode } = store.state;
    if (e.type === "note") {
      const isOn = e.velocity > 0;
      if (isOn) {
        const ni = e.noteNumber;
        console.log("note", ni);
        const shortCuts: Record<number, () => void> = {
          48: uiActions.stepBack,
          50: uiActions.stepForward,
          78: uiActions.toggleEditMode,
          77: uiActions.putRest,
          79: uiActions.putTie,
        };
        const shortcut = shortCuts[ni];
        if (shortcut) {
          shortcut();
          return;
        }
        if (editMode) {
          editCoreActions.putNote(ni);
          uiActions.shiftCursorPos(1);
        }
        synthActions.noteOn(ni, e.velocity);
      } else {
        synthActions.noteOff(e.noteNumber);
      }
    }
  },
};

function durationToString(d: number) {
  if (d === 1) return "/16";
  if (d === 2) return "/8";
  if (d === 4) return "/4";
  return String(d);
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

const EditorArea = () => {
  const st = store.useSnapshot();
  return (
    <div
      css={{
        width: "200px",
        height: "200px",
        border: "solid 1px #888",
      }}
    >
      <svg viewBox="0 0 200 200">
        <g>
          {seqNumbers(16).map((iy) => {
            return seqNumbers(16).map((ix) => {
              const cellIdx = iy * 16 + ix;
              const noteNumber = st.stepCells[cellIdx];
              let color = "transparent";
              if (noteNumber < SpecialNotes.None) {
                color = "#8f8";
              } else if (noteNumber === SpecialNotes.Tie) {
                color = "#ccc";
              }
              return (
                <rect
                  key={`${ix},${iy}`}
                  x={ix * 12.5}
                  y={iy * 12.5}
                  width="12.5"
                  height="12.5"
                  fill={color}
                  stroke="#ddd"
                />
              );
            });
          })}
        </g>
        <g>
          <rect
            x={(st.cursorPos % 16) * 12.5}
            y={((st.cursorPos / 16) >>> 0) * 12.5}
            width={(st.cursorDuration / 16) * 200}
            height="12.5"
            fill="transparent"
            stroke="#0d0"
          />
        </g>
      </svg>
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
      <EditorArea />
      <RightControlArea />
    </div>
  );
};

const DebugSection = () => {
  const st = store.useSnapshot();
  return (
    <div>
      <div>pos: {st.cursorPos}</div>
      <div>duration: {st.cursorDuration}</div>
      <div>durationStr: {durationToString(st.cursorDuration)}</div>
    </div>
  );
};

const App = () => {
  useEffect(() => {
    void setupMidiKeyboardInput(uiActions.handleMidiInput);
  }, []);
  return (
    <div className="flex-vc" css={{ width: "100vw", height: "100vh" }}>
      <DebugSection />
      <PanelBody />
    </div>
  );
};

mountAppRoot(<App />, "app");
