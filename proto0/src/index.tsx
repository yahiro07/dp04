import { mountAppRoot } from "@/utils/mount-app-root";
import "./styling/page.css";
import "./styling/utility-classes.css";
import { createStore } from "snap-store";

const store = createStore<{ count: number }>({
  count: 0,
});

const EditorArea = () => {
  const { count } = store.useSnapshot();
  return (
    <div
      css={{
        width: "400px",
        height: "400px",
        border: "solid 1px #888",
      }}
    >
      <p>Count: {count}</p>
      <button type="button" onClick={() => store.setCount((c) => c + 1)}>
        inc
      </button>
    </div>
  );
};

const App = () => {
  return (
    <div className="flex-c" css={{ width: "100vw", height: "100vh" }}>
      <EditorArea />
    </div>
  );
};

mountAppRoot(<App />, "app");
