import { mountAppRoot } from "@/utils/mount-app-root";
import "./styling/page.css";
import "./styling/utility-classes.css";
import { createStore } from "snap-store";

//used later
// const synth = new (
//   window as unknown as {
//     WebAudioTinySynth: new () => { send: (data: number[]) => void };
//   }
// ).WebAudioTinySynth();
//usage
//synth.send([0x90, 36, 100])

type CommandItem = {
  bytes: number[];
};

const store = createStore<{ commandItems: CommandItem[] }>({
  commandItems: [],
});

namespace SmfReader {
  //TODO define helper functions here
  export function loadFromFile(file: File): CommandItem[] {
    //temporary (dummy) data
    const commands: CommandItem[] = [
      { bytes: [0x90, 0x3c, 0x7f] },
      { bytes: [0x80, 0x3c, 0x00] },
      { bytes: [0x90, 0x3c, 0x7f] },
      { bytes: [0x80, 0x3c, 0x00] },
      { bytes: [0x90, 0x3c, 0x7f] },
      { bytes: [0x80, 0x3c, 0x00] },
      { bytes: [0x90, 0x3c, 0x7f] },
      { bytes: [0x80, 0x3c, 0x00] },
    ];
    return commands;
  }
}

const actions = {
  loadSmfFile(droppedFile: File) {
    const commands = SmfReader.loadFromFile(droppedFile);
    store.mutations.setCommandItems(commands);
  },
  clearCommands() {
    store.mutations.setCommandItems([]);
  },
};

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
      className="min-w-[60px] h-[40px]"
      css={{
        border: "solid 1px #888",
        backgroundColor: active ? "#ddd" : "#fff",
        borderRadius: "999px",
        cursor: "pointer",
      }}
    >
      {text && <span>{text}</span>}
      {children}
    </button>
  );
};
const CommandListView = () => {
  const { commandItems } = store.useSnapshot();
  return (
    <div className="flex-v border border-[#888] min-w-[400px] min-h-[100px] max-h-[200px] overflow-y-scroll">
      {commandItems.map((item, index) => (
        <div key={index.toString()}>
          {item.bytes.map((b) => b.toString(16).padStart(2, "0")).join(" ")}
        </div>
      ))}
    </div>
  );
};

const FileDropArea = () => {
  return (
    <div
      className="flex-c border border-[#888] p-10 border-dashed"
      onClick={() => actions.loadSmfFile(undefined as unknown as File)}
    >
      drop midi file here
    </div>
  );
};

const ControlPanel = () => {
  return (
    <div className="flex-vl gap-2">
      <FileDropArea />
      <Button onClick={() => actions.clearCommands()} text="clear" />
    </div>
  );
};

const App = () => {
  return (
    <div className="flex-c gap-4" css={{ width: "100vw", height: "100vh" }}>
      <CommandListView />
      <ControlPanel />
    </div>
  );
};

mountAppRoot(<App />, "app");
