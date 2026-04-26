import { createStore } from "snap-store";
import { Button } from "@/components/button";
import { mountAppRoot } from "@/utils/mount-app-root";
import "./styling/page.css";
import "./styling/utility-classes.css";

type Command = {};

const store = createStore<{ commands: Command }>({
  commands: [],
});

const actions = {
  loadVgmFileWithDialog() {},
};

const App = () => {
  return (
    <div className="w-dvw h-dvh p-2">
      <div className="flex-ha gap-2">
        <Button onClick={actions.loadVgmFileWithDialog}>load</Button>
        <div className="text-[#666]">
          load vgm files, only OPL2 (YM3812) supported
        </div>
      </div>
    </div>
  );
};

mountAppRoot(<App />, "app");
