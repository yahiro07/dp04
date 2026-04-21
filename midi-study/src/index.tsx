import { mountAppRoot } from "@/utils/mount-app-root";
import "./styling/page.css";
import "./styling/utility-classes.css";
import { useEffect } from "react";
import { createStore } from "snap-store";
import { Button } from "@/button";
import { FullScreenMidiFileDropArea } from "@/midi-file-drop-area";
import { SmfDataDecorator } from "@/smf-data-decorator";
import { createSmfFileDataManager } from "@/smf-file-data-manager";
import { createSmfPlayer } from "@/smf-player";
import { CommandItem, SmfSong, SmfSongMeta } from "@/smf-reader";

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

const storeActions = {
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

const smfFileDataManager = createSmfFileDataManager({
  songLoadedCallback: storeActions.loadSong,
  loadFailureCallback: storeActions.loadFailed,
  clearCallback: storeActions.clearCommands,
});

const uiActions = {
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
        onClick={() => uiActions.togglePlayState()}
      />
      <div>tempo: {defaultTempo ?? "unknown"}</div>
      <Button
        onClick={() => smfFileDataManager.loadSfmFileWithDialog()}
        text="load"
      />
      <Button
        onClick={() => smfFileDataManager.clearSmfFileLoaded()}
        text="clear"
      />
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
    smfFileDataManager.restoreSmfFileFromSession();
  }, []);

  return (
    <div className="flex-c gap-4" css={{ width: "100dvw", height: "100dvh" }}>
      <FullScreenMidiFileDropArea onFileDrop={smfFileDataManager.loadSmfFile} />
      <div className="flex-v gap-2">
        <PlayControlPart />
        <CommandListView />
      </div>
    </div>
  );
};

mountAppRoot(<App />, "app");
