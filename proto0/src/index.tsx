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

const maxStep = 16 * 16;

const synth = new (
  window as unknown as {
    WebAudioTinySynth: new () => { send: (data: number[]) => void };
  }
).WebAudioTinySynth();

//usage
//synth.send([0x90, 36, 100])

const store = createStore<{
  cursorPos: number;
  cursorDuration: number;
  editMode: boolean;
}>({
  cursorPos: 0,
  cursorDuration: 2,
  editMode: false,
});

const durationValues = [4, 2, 1];

const actions = {
  dummy() {},
  shiftCursorPos(dir: -1 | 1) {
    const { cursorDuration } = store.state;
    store.mutations.setCursorPos((prev) => {
      return (prev + dir * cursorDuration + maxStep) % maxStep;
    });
  },
  shiftCursorPosV(dir: -1 | 1) {
    const amount = 16;
    store.mutations.setCursorPos((prev) => {
      return (prev + dir * amount + maxStep) % maxStep;
    });
  },
  shiftDuration(dir: -1 | 1) {
    const { cursorDuration } = store.state;
    const idx = durationValues.indexOf(cursorDuration);
    const newIdx = (idx + dir + durationValues.length) % durationValues.length;
    store.mutations.setCursorDuration(durationValues[newIdx]);
  },
  putTie() {
    actions.shiftCursorPos(1);
  },
  putRest() {
    actions.shiftCursorPos(1);
  },
  toggleEditMode() {
    store.mutations.toggleEditMode();
  },
  handleMidiInput(e: MidiKeyboardInputEvent) {
    if (e.type === "note") {
      const isOn = e.velocity > 0;
      if (isOn) {
        const ni = e.noteNumber;
        console.log("note", ni);
        if (1) {
          if (ni === 48) {
            actions.shiftCursorPos(-1);
          } else if (ni === 50) {
            actions.shiftCursorPos(1);
          } else if (ni === 78) {
            actions.toggleEditMode();
          } else if (ni === 77) {
            actions.putRest();
          } else if (ni === 79) {
            actions.putTie();
          }
        }
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
              return (
                <rect
                  key={`${ix},${iy}`}
                  x={ix * 12.5}
                  y={iy * 12.5}
                  width="12.5"
                  height="12.5"
                  fill="transparent"
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
        <Button text="←" onClick={() => actions.shiftCursorPos(-1)} />
      </div>
      <div className="flex-v">
        <Button text="↑" onClick={() => actions.shiftCursorPosV(-1)} />
        <div className="h-[40px]" />
        <Button text="↓" onClick={() => actions.shiftCursorPosV(1)} />
      </div>
      <div>
        <Button text="→" onClick={() => actions.shiftCursorPos(1)} />
      </div>
    </div>
  );
};

const RightControlArea = () => {
  const { editMode } = store.useSnapshot();
  return (
    <div className="flex-ha">
      <div>
        <Button text="dur" onClick={() => actions.shiftDuration(1)} />
      </div>
      <div className="flex-v">
        <Button
          text="edit"
          active={editMode}
          onClick={() => actions.toggleEditMode()}
        />
        <div className="h-[40px]" />
        <Button text="rest" onClick={() => actions.putRest()} />
      </div>
      <div>
        <Button text="tie" onClick={() => actions.putTie()} />
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
    void setupMidiKeyboardInput(actions.handleMidiInput);
  }, []);
  return (
    <div className="flex-vc" css={{ width: "100vw", height: "100vh" }}>
      <DebugSection />
      <PanelBody />
    </div>
  );
};

mountAppRoot(<App />, "app");
