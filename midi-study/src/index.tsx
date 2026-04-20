import { mountAppRoot } from "@/utils/mount-app-root";
import "./styling/page.css";
import "./styling/utility-classes.css";
import { useRef, useState } from "react";
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
  tick: number;
  bytes: number[];
};

const store = createStore<{
  commandItems: CommandItem[];
  errorMessage: string | null;
}>({
  commandItems: [],
  errorMessage: null,
});

namespace SmfReader {
  const TRACK_HEADER = "MTrk";
  const HEADER_CHUNK = "MThd";

  class ByteReader {
    private offset = 0;

    constructor(private readonly bytes: Uint8Array) {}

    get position() {
      return this.offset;
    }

    get remaining() {
      return this.bytes.length - this.offset;
    }

    readUint8() {
      this.ensureRemaining(1);
      return this.bytes[this.offset++];
    }

    readUint16() {
      this.ensureRemaining(2);
      const value =
        (this.bytes[this.offset] << 8) | this.bytes[this.offset + 1];
      this.offset += 2;
      return value;
    }

    readUint32() {
      this.ensureRemaining(4);
      const value =
        this.bytes[this.offset] * 0x1000000 +
        (this.bytes[this.offset + 1] << 16) +
        (this.bytes[this.offset + 2] << 8) +
        this.bytes[this.offset + 3];
      this.offset += 4;
      return value;
    }

    readString(length: number) {
      const chars = this.readBytes(length);
      return String.fromCharCode(...chars);
    }

    readBytes(length: number) {
      this.ensureRemaining(length);
      const value = this.bytes.slice(this.offset, this.offset + length);
      this.offset += length;
      return value;
    }

    skip(length: number) {
      this.ensureRemaining(length);
      this.offset += length;
    }

    readVariableLengthQuantity() {
      let value = 0;
      for (let i = 0; i < 4; i += 1) {
        const byte = this.readUint8();
        value = (value << 7) | (byte & 0x7f);
        if ((byte & 0x80) === 0) {
          return value;
        }
      }
      throw new Error("Invalid variable-length quantity");
    }

    private ensureRemaining(length: number) {
      if (this.remaining < length) {
        throw new Error("Unexpected end of MIDI data");
      }
    }
  }

  function getMessageDataLength(statusByte: number) {
    const upper = statusByte & 0xf0;
    if (upper === 0xc0 || upper === 0xd0) {
      return 1;
    }
    if (upper >= 0x80 && upper <= 0xe0) {
      return 2;
    }
    return 0;
  }

  function parseTrack(trackBytes: Uint8Array): CommandItem[] {
    const reader = new ByteReader(trackBytes);
    const commands: CommandItem[] = [];
    let tick = 0;
    let runningStatus: number | null = null;

    while (reader.remaining > 0) {
      tick += reader.readVariableLengthQuantity();
      const firstByte = reader.readUint8();

      if (firstByte === 0xff) {
        runningStatus = null;
        const metaType = reader.readUint8();
        const length = reader.readVariableLengthQuantity();
        reader.skip(length);
        if (metaType === 0x2f) {
          break;
        }
        continue;
      }

      if (firstByte === 0xf0 || firstByte === 0xf7) {
        runningStatus = null;
        const length = reader.readVariableLengthQuantity();
        const data = reader.readBytes(length);
        commands.push({ tick, bytes: [firstByte, ...data] });
        continue;
      }

      let statusByte = firstByte;
      let dataBytes: number[];

      if ((firstByte & 0x80) === 0) {
        if (runningStatus == null) {
          throw new Error("Running status encountered before status byte");
        }
        statusByte = runningStatus;
        const dataLength = getMessageDataLength(statusByte);
        if (dataLength === 0) {
          throw new Error(
            `Unsupported running status: 0x${statusByte.toString(16)}`,
          );
        }
        dataBytes = [firstByte, ...reader.readBytes(dataLength - 1)];
      } else {
        runningStatus = statusByte;
        const dataLength = getMessageDataLength(statusByte);
        if (dataLength === 0) {
          throw new Error(
            `Unsupported MIDI status byte: 0x${statusByte.toString(16)}`,
          );
        }
        dataBytes = [...reader.readBytes(dataLength)];
      }

      commands.push({
        tick,
        bytes: [statusByte, ...dataBytes],
      });
    }

    return commands;
  }

  export function loadFromArrayBuffer(buffer: ArrayBuffer): CommandItem[] {
    const reader = new ByteReader(new Uint8Array(buffer));
    const chunkType = reader.readString(4);
    if (chunkType !== HEADER_CHUNK) {
      throw new Error("MIDI header chunk (MThd) not found");
    }

    const headerLength = reader.readUint32();
    if (headerLength < 6) {
      throw new Error("Invalid MIDI header length");
    }

    const formatType = reader.readUint16();
    const trackCount = reader.readUint16();
    reader.readUint16();
    if (headerLength > 6) {
      reader.skip(headerLength - 6);
    }

    if (![0, 1, 2].includes(formatType)) {
      throw new Error(`Unsupported MIDI format: ${formatType}`);
    }

    const allCommands: CommandItem[] = [];
    for (let trackIndex = 0; trackIndex < trackCount; trackIndex += 1) {
      const trackType = reader.readString(4);
      if (trackType !== TRACK_HEADER) {
        throw new Error(`Track chunk ${trackIndex} is invalid`);
      }
      const trackLength = reader.readUint32();
      const trackBytes = reader.readBytes(trackLength);
      allCommands.push(...parseTrack(trackBytes));
    }

    return allCommands.sort((a, b) => a.tick - b.tick);
  }

  export async function loadFromFile(file: File): Promise<CommandItem[]> {
    const buffer = await file.arrayBuffer();
    return loadFromArrayBuffer(buffer);
  }
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

      const commands = await SmfReader.loadFromFile(droppedFile);
      store.mutations.setCommandItems(commands);
      store.mutations.setErrorMessage(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to parse MIDI file";
      store.mutations.setCommandItems([]);
      store.mutations.setErrorMessage(message);
    }
  },
  clearCommands() {
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
  return (
    <div className="flex-c gap-4" css={{ width: "100vw", height: "100vh" }}>
      <CommandListView />
      <ControlPanel />
    </div>
  );
};

mountAppRoot(<App />, "app");
