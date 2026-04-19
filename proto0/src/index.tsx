import { mountAppRoot } from "@/utils/mount-app-root";
import "./styling/page.css";
import "./styling/utility-classes.css";
import { createStore } from "snap-store";

const maxStep = 64;

const store = createStore<{ cursorPos: number; cursorDuration: number }>({
  cursorPos: 0,
  cursorDuration: 2,
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
        backgroundColor: active ? "#ddd" : "#fff",
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
      <div>pos: {st.cursorPos}</div>
      <div>duration: {st.cursorDuration}</div>
      <div>durationStr: {durationToString(st.cursorDuration)}</div>
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
  return (
    <div className="flex-ha">
      <div>
        <Button text="dur" onClick={() => actions.shiftDuration(1)} />
      </div>
      <div className="flex-v">
        <Button text="edit" onClick={() => actions.dummy()} />
        <div className="h-[40px]" />
        <Button text="rest" onClick={() => actions.dummy()} />
      </div>
      <div>
        <Button text="tie" onClick={() => actions.dummy()} />
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

const App = () => {
  return (
    <div className="flex-c" css={{ width: "100vw", height: "100vh" }}>
      <PanelBody />
    </div>
  );
};

mountAppRoot(<App />, "app");
