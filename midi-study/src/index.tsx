import { mountAppRoot } from "@/utils/mount-app-root";
import "./styling/page.css";
import "./styling/utility-classes.css";
import { useEffect } from "react";
import { createStore } from "snap-store";
import { Button } from "@/button";
import { FileDataPersistence } from "@/file-data-persistence";
import { FullScreenMidiFileDropArea } from "@/midi-file-drop-area";
import { SmfDataDecorator } from "@/smf-data-decorator";
import { createSmfPlayer } from "@/smf-player";
import { CommandItem, SmfReader, SmfSong, SmfSongMeta } from "@/smf-reader";

const store = createStore<{
  commandItems: CommandItem[];
  songMeta: SmfSongMeta | null;
  errorMessage: string | null;
  commandIndex: number;
  playing: boolean;
  defaultTempo: number | null;
}>({
  commandItems: [],
  songMeta: null,
  errorMessage: null,
  commandIndex: 0,
  playing: false,
  defaultTempo: null,
});

const smfPlayer = createSmfPlayer();

const actionsInternal = {
  loadSong(song: SmfSong) {
    SmfDataDecorator.decorateCommandItems(song.commands);
    const defaultTempo = SmfDataDecorator.extractDefaultTempo(song);
    store.mutations.assigns({
      commandItems: song.commands,
      songMeta: song.meta,
      errorMessage: null,
      defaultTempo,
    });
  },
  loadFailed(message: string) {
    store.mutations.assigns({
      commandItems: [],
      songMeta: null,
      errorMessage: message,
    });
  },
  clearCommands() {
    store.mutations.assigns({
      commandItems: [],
      songMeta: null,
      errorMessage: null,
    });
  },
};

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
      const song = SmfReader.loadFromArrayBuffer(fileBytes.buffer);
      FileDataPersistence.saveFileBytes(fileBytes);
      actionsInternal.loadSong(song);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to parse MIDI file";
      actionsInternal.loadFailed(message);
    }
  },
  restoreSmfFileFromSession() {
    try {
      const fileBytes = FileDataPersistence.loadFileBytes();
      if (!fileBytes) {
        return;
      }
      const song = SmfReader.loadFromArrayBuffer(
        fileBytes.buffer.slice(
          fileBytes.byteOffset,
          fileBytes.byteOffset + fileBytes.byteLength,
        ),
      );
      actionsInternal.loadSong(song);
    } catch (error) {
      FileDataPersistence.clearFileBytes();
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to restore MIDI file from sessionStorage";
      actionsInternal.loadFailed(errorMessage);
    }
  },
  clearSong() {
    FileDataPersistence.clearFileBytes();
    actionsInternal.clearCommands();
  },
  togglePlayState() {
    const { playing, commandItems, songMeta, defaultTempo } = store.state;
    if (!songMeta) return;
    if (!playing) {
      store.mutations.setPlaying(true);
      smfPlayer.play({
        commands: commandItems,
        timeDivision: songMeta.timeDivision,
        defaultTempo: defaultTempo ?? 120,
      });
    } else {
      store.mutations.setPlaying(false);
      smfPlayer.stop();
    }
  },
};

const PlayControlPart = () => {
  const { playing, songMeta, defaultTempo } = store.useSnapshot();
  return (
    <div className="flex-ha gap-2">
      <Button
        active={playing}
        text="play"
        disabled={!songMeta}
        onClick={() => actions.togglePlayState()}
      />
      <div>tempo: {defaultTempo ?? "unknown"}</div>
      <Button onClick={() => actions.clearSong()} text="clear" />
    </div>
  );
};

const CommandListView = () => {
  const { commandItems, errorMessage, commandIndex } = store.useSnapshot();
  return (
    <div className="flex-v border border-[#888] min-w-[400px] min-h-[100px] max-h-[600px] overflow-y-scroll p-2">
      {errorMessage && <div css={{ color: "#b42318" }}>{errorMessage}</div>}
      {commandItems.map((item, index) => (
        <div
          key={index.toString()}
          className="flex-ha gap-4"
          onClick={() => {
            store.mutations.setCommandIndex(index);
          }}
          css={{
            cursor: "pointer",
            backgroundColor: commandIndex === index ? "#ccffcc" : "#fff",
          }}
        >
          <span className="min-w-[20px]">
            {item.trackIndex.toString().padStart(2, "0")}
          </span>
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

const App = () => {
  useEffect(() => {
    actions.restoreSmfFileFromSession();
  }, []);

  return (
    <div className="flex-c gap-4" css={{ width: "100dvw", height: "100dvh" }}>
      <FullScreenMidiFileDropArea onFileDrop={actions.loadSmfFile} />
      <div className="flex-v gap-2">
        <PlayControlPart />
        <CommandListView />
      </div>
    </div>
  );
};

mountAppRoot(<App />, "app");
