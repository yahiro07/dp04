import { mountAppRoot } from "@/utils/mount-app-root";
import "./styling/page.css";
import "./styling/utility-classes.css";
import { createStore } from "snap-store";

const synth = new (
  window as unknown as {
    WebAudioTinySynth: new () => { send: (data: number[]) => void };
  }
).WebAudioTinySynth();
//usage
//synth.send([0x90, 36, 100])

const store = createStore<{ cursorPos: number; cursorDuration: number }>({
  cursorPos: 0,
  cursorDuration: 2,
});

const App = () => {
  return (
    <div className="flex-vc" css={{ width: "100vw", height: "100vh" }}>
      aaaa
    </div>
  );
};

mountAppRoot(<App />, "app");
