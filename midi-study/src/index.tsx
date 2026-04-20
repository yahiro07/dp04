import { mountAppRoot } from "@/utils/mount-app-root";
import "./styling/page.css";
import "./styling/utility-classes.css";
import { useEffect, useRef, useState } from "react";
import { createStore } from "snap-store";
import { FileDataPersistence } from "@/file-data-persistence";
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
        <div key={index.toString()}>
          <span css={{ color: "#666", marginRight: 8 }}>
            {item.tick.toString().padStart(6, " ")}
          </span>
          {item.bytes.map((b) => b.toString(16).padStart(2, "0")).join(" ")}
        </div>
      ))}
    </div>
  );
};

const FileDropArea = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const loadFile = (file: File | null | undefined) => {
    if (!file) {
      return;
    }
    void actions.loadSmfFile(file);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".mid,.midi,audio/midi,audio/x-midi"
        hidden
        onChange={(event) => {
          loadFile(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
      />
      {/* biome-ignore lint/a11y/noStaticElementInteractions: drag&drop area */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: drag&drop area */}
      <div
        className="flex-c border border-[#888] p-10 border-dashed"
        css={{
          minHeight: 140,
          cursor: "pointer",
          backgroundColor: isDragging ? "#eef6ff" : "#fff",
          transition: "background-color 120ms ease",
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget === event.target) {
            setIsDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          loadFile(event.dataTransfer.files?.[0]);
        }}
      >
        <div className="flex-vc gap-2">
          <div>drop midi file here</div>
          <div css={{ fontSize: 12, color: "#666" }}>
            or click to choose a `.mid` / `.midi` file
          </div>
        </div>
      </div>
    </>
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
