import { mountAppRoot } from "@/utils/mount-app-root";
import "./styling/page.css";
import "./styling/utility-classes.css";
import { useEffect } from "react";
import { createStore } from "snap-store";
import { FileDataPersistence } from "@/file-data-persistence";
import { HeadlessFileDropArea } from "@/headless-file-drop-area";
import { CommandItem, SmfReader } from "@/smf-reader";

//used later
// const synth = new (
//   window as unknown as {
//     WebAudioTinySynth: new () => { send: (data: number[]) => void };
//   }
// ).WebAudioTinySynth();
//usage
//synth.send([0x90, 36, 100])

const store = createStore<{
  commandItems: CommandItem[];
  errorMessage: string | null;
}>({
  commandItems: [],
  errorMessage: null,
});

function decorateCommandItems(commandItems: CommandItem[]) {
  commandItems.forEach((item) => {
    const status = item.bytes[0];
    const data1 = item.bytes[1] ?? 0;
    const data2 = item.bytes[2] ?? 0;
    const ch = status & 0x0f;
    const op = status & 0xf0;
    const comment = (() => {
      if (op === 0xb0) {
        return `ch ${ch} CC#${data1} ${data2} `;
      } else if (op === 0xc0) {
        return `ch ${ch} prog ${data1}`;
      } else if (op === 0x90) {
        if (data2 === 0) {
          return `ch ${ch} note off ${data1}`;
        }
        return `ch ${ch} note on ${data1} ${data2} `;
      }
    })();
    if (comment) {
      item.comment = comment;
    }
  });
}

const actions = {
  async loadSmfFile(droppedFile: File) {
    try {
      const lowerName = droppedFile.name.toLowerCase();
      const isMidiFile =
        lowerName.endsWith(".mid") ||
        lowerName.endsWith(".midi") ||
        droppedFile.type === "audio/midi" ||
        droppedFile.type === "audio/x-midi" ||
        droppedFile.type === "";

      if (!isMidiFile) {
        throw new Error("Please choose a MIDI file (.mid or .midi)");
      }

      const fileBytes = new Uint8Array(await droppedFile.arrayBuffer());
      const commands = SmfReader.loadFromArrayBuffer(fileBytes.buffer);
      FileDataPersistence.saveFileBytes(fileBytes);
      decorateCommandItems(commands);
      store.mutations.setCommandItems(commands);
      store.mutations.setErrorMessage(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to parse MIDI file";
      store.mutations.setCommandItems([]);
      store.mutations.setErrorMessage(message);
    }
  },
  restoreSmfFileFromSession() {
    try {
      const fileBytes = FileDataPersistence.loadFileBytes();
      if (!fileBytes) {
        return;
      }

      const commands = SmfReader.loadFromArrayBuffer(
        fileBytes.buffer.slice(
          fileBytes.byteOffset,
          fileBytes.byteOffset + fileBytes.byteLength,
        ),
      );
      decorateCommandItems(commands);
      store.mutations.setCommandItems(commands);
      store.mutations.setErrorMessage(null);
    } catch (error) {
      FileDataPersistence.clearFileBytes();
      store.mutations.setCommandItems([]);
      store.mutations.setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to restore MIDI file from sessionStorage",
      );
    }
  },
  clearCommands() {
    FileDataPersistence.clearFileBytes();
    store.mutations.setCommandItems([]);
    store.mutations.setErrorMessage(null);
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
  const { commandItems, errorMessage } = store.useSnapshot();
  return (
    <div className="flex-v border border-[#888] min-w-[400px] min-h-[100px] max-h-[600px] overflow-y-scroll p-2">
      {errorMessage && <div css={{ color: "#b42318" }}>{errorMessage}</div>}
      {commandItems.map((item, index) => (
        <div key={index.toString()} className="flex-ha gap-4">
          <span className="min-w-[40px] text-[#666]">
            {item.tick.toString().padStart(6, " ")}
          </span>
          <div className="min-w-[100px]">
            {item.bytes.map((b) => b.toString(16).padStart(2, "0")).join(" ")}
          </div>
          <div>{item.comment}</div>
        </div>
      ))}
    </div>
  );
};

const MidiFileDropAreaView = ({ isDragging }: { isDragging: boolean }) => (
  <div
    className="flex-vc gap-2 border border-[#888] p-10 border-dashed"
    css={{
      minHeight: 140,
      cursor: "pointer",
      backgroundColor: isDragging ? "#eef6ff" : "#fff",
      transition: "background-color 120ms ease",
    }}
  >
    <div>drop midi file here</div>
    <div css={{ fontSize: 12, color: "#666" }}>
      or click to choose a `.mid` / `.midi` file
    </div>
  </div>
);

const MidiFileDropArea = () => {
  const loadFile = (file: File | null | undefined) => {
    if (!file) {
      return;
    }
    void actions.loadSmfFile(file);
  };
  return (
    <HeadlessFileDropArea
      accept=".mid,.midi,audio/midi,audio/x-midi"
      onDrop={loadFile}
      renderContent={MidiFileDropAreaView}
    />
  );
};

const ControlPanel = () => {
  return (
    <div className="flex-vl gap-2">
      <MidiFileDropArea />
      <Button onClick={() => actions.clearCommands()} text="clear" />
    </div>
  );
};

const App = () => {
  useEffect(() => {
    actions.restoreSmfFileFromSession();
  }, []);

  return (
    <div className="flex-c gap-4" css={{ width: "100vw", height: "100vh" }}>
      <CommandListView />
      <ControlPanel />
    </div>
  );
};

mountAppRoot(<App />, "app");
