import { mountAppRoot } from "@/utils/mount-app-root";
import "./styling/page.css";
import "./styling/utility-classes.css";
import { createStore } from "snap-store";
import { seqNumbers } from "@/utils/array-utils";

const store = createStore<{
  cursorPos: number;
  cursorDuration: number;
  editMode: boolean;
}>({
  cursorPos: 0,
  cursorDuration: 2,
  editMode: false,
});

const BarBoxTall = () => {
  return (
    <div
      css={{
        width: "80px",
        height: "360px",
        border: "solid 1px #888",
      }}
    >
      <svg viewBox="0 0 80 360">
        <g>
          {seqNumbers(36).map((iy) => {
            return seqNumbers(8).map((ix) => {
              return (
                <rect
                  key={`${ix},${iy}`}
                  x={ix * 10}
                  y={iy * 10}
                  width="10"
                  height="10"
                  fill="none"
                  stroke="#ddd"
                />
              );
            });
          })}
        </g>
      </svg>
    </div>
  );
};

const BarBoxShort = () => {
  return (
    <div
      css={{
        width: "80px",
        height: "60px",
        border: "solid 1px #888",
      }}
    >
      <svg viewBox="0 0 80 60">
        <g>
          {seqNumbers(6).map((iy) => {
            return seqNumbers(8).map((ix) => {
              return (
                <rect
                  key={`${ix},${iy}`}
                  x={ix * 10}
                  y={iy * 10}
                  width="10"
                  height="10"
                  fill="none"
                  stroke="#ddd"
                />
              );
            });
          })}
        </g>
      </svg>
    </div>
  );
};

const PanelBody = () => {
  return (
    <div className="flex-v p-5 border border-[#888] gap-2">
      <div className="flex-ha">
        <BarBoxTall />
        <BarBoxTall />
        <BarBoxTall />
        <BarBoxTall />
        <BarBoxTall />
        <BarBoxTall />
        <BarBoxTall />
        <BarBoxTall />
      </div>
      <div className="flex-ha">
        <BarBoxShort />
        <BarBoxShort />
        <BarBoxShort />
        <BarBoxShort />
        <BarBoxShort />
        <BarBoxShort />
        <BarBoxShort />
        <BarBoxShort />
      </div>
    </div>
  );
};

const DebugSection = () => {
  const st = store.useSnapshot();
  return (
    <div className="absolute top-0 right-0">
      <div>pos: {st.cursorPos}</div>
      <div>duration: {st.cursorDuration}</div>
    </div>
  );
};

const App = () => {
  return (
    <div className="flex-vc" css={{ width: "100vw", height: "100vh" }}>
      <DebugSection />
      <PanelBody />
    </div>
  );
};

mountAppRoot(<App />, "app");
