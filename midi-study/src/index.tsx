import { mountAppRoot } from "@/utils/mount-app-root";
import "./styling/page.css";
import "./styling/utility-classes.css";
import { useEffect } from "react";
import { createStore } from "snap-store";
import { Button } from "@/components/button";
import { FullScreenMidiFileDropArea } from "@/components/midi-file-drop-area";
import { buildFlowNodes } from "@/flow-nodes-builder";
import { SmfDataDecorator } from "@/smf-data-decorator";
import { createSmfFileDataManager } from "@/smf-file-data-manager";
import { createSmfPlayer } from "@/smf-player";
import { npx } from "@/styling/styling-utils";
import { CommandItem, FlowNode, SmfSong, SmfSongMeta } from "@/types";
import { seqNumbers } from "@/utils/array-utils";

const store = createStore<{
  commandItems: CommandItem[];
  songMeta: SmfSongMeta | null;
  errorMessage: string | null;
  commandIndex: number;
  playing: boolean;
  defaultTempo: number | null;
  outlineViewNodes: FlowNode[];
  blockNodes: FlowNode[] | null;
  blockNodeSelectionIndex: number;
}>({
  commandItems: [],
  songMeta: null,
  errorMessage: null,
  commandIndex: 0,
  playing: false,
  defaultTempo: null,
  outlineViewNodes: [],
  blockNodes: null,
  blockNodeSelectionIndex: -1,
});

const smfPlayer = createSmfPlayer();

const storeActions = {
  loadSong(song: SmfSong) {
    SmfDataDecorator.decorateCommandItems(song.commands);
    const defaultTempo = SmfDataDecorator.extractDefaultTempo(song);
    const outlineViewNodes = buildFlowNodes(song);
    store.mutations.assigns({
      commandItems: song.commands,
      songMeta: song.meta,
      errorMessage: null,
      defaultTempo,
      outlineViewNodes,
      blockNodes: null,
      blockNodeSelectionIndex: -1,
    });
  },
  loadFailed(message: string) {
    store.mutations.assigns({
      commandItems: [],
      songMeta: null,
      errorMessage: message,
      outlineViewNodes: [],
      blockNodes: null,
      blockNodeSelectionIndex: -1,
    });
  },
  clearCommands() {
    store.mutations.assigns({
      commandItems: [],
      songMeta: null,
      errorMessage: null,
      outlineViewNodes: [],
      blockNodes: null,
      blockNodeSelectionIndex: -1,
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

const OutlineView = () => {
  const { outlineViewNodes } = store.useSnapshot();
  const numTracks =
    outlineViewNodes.reduce((max, node) => Math.max(max, node.trackIndex), 0) +
    1;
  const baseY = 32;

  const handleClick = (node: FlowNode) => {
    console.log(node.trackIndex, node.stepPosition, node.type);
    const blockIndex = (node.stepPosition / 64) >>> 0;
    const sameBlockNodes = outlineViewNodes
      .filter((n) => {
        return (
          n.trackIndex === node.trackIndex &&
          (n.stepPosition / 64) >>> 0 === blockIndex
        );
      })
      .map((node) => {
        const head = blockIndex * 64;
        return { ...node, stepPosition: node.stepPosition - head };
      });
    // console.log({ sameBlockNodes });
    store.mutations.setBlockNodes(sameBlockNodes);
  };
  return (
    <div className="border border-[#888] min-w-[400px] min-h-[100px] max-h-[600px] overflow-scroll p-2 relative">
      {seqNumbers(numTracks).map((trackIndex) => (
        <div
          key={trackIndex.toString()}
          css={{
            position: "absolute",
            left: npx(trackIndex * 32),
            top: npx(0),
            width: npx(32),
            height: npx(2),
            border: "1px solid #ccc",
            fontSize: "8px",
          }}
        >
          {trackIndex}
        </div>
      ))}
      {outlineViewNodes.map((node, index) => {
        const uw = 32;
        const uh = 2;
        const qx = node.trackIndex * uw;
        const qy = baseY + node.stepPosition * uh;
        const qh = node.type === "note" ? node.stepDuration * uh : uh;
        const text = node.type === "note" ? node.noteNumber : undefined;
        return (
          <div
            key={index.toString()}
            css={{
              position: "absolute",
              left: npx(qx),
              top: npx(qy),
              width: npx(uw),
              height: npx(qh),
              border: "1px solid #ccc",
              fontSize: "8px",
            }}
            onClick={() => handleClick(node)}
          >
            {text}
          </div>
        );
      })}
    </div>
  );
};

const BlockNodeListColumn = () => {
  const st = store.useSnapshot();
  const blockNodes = st.blockNodes ?? [];
  return (
    <div className="flex-v border border-[#888] min-w-[200px] min-h-[100px] max-h-[600px] overflow-y-scroll p-2">
      {blockNodes.map((item, index) => (
        <div
          key={index.toString()}
          className="flex-ha gap-4"
          onClick={() => {
            store.mutations.setBlockNodeSelectionIndex(index);
          }}
          css={{
            cursor: "pointer",
            backgroundColor:
              st.blockNodeSelectionIndex === index ? "#ccffcc" : "#fff",
          }}
        >
          <span className="min-w-[20px]">
            {item.trackIndex.toString().padStart(2, "0")}
          </span>
          <span className="min-w-[40px] text-[#666]">
            {item.stepPosition.toFixed(2).padStart(2, "0")}
          </span>
          <div className="min-w-[100px]">
            {item.type === "command" &&
              item.bytes.map((b) => b.toString(16).padStart(2, "0")).join(" ")}
            {item.type === "note" &&
              `note ch:${item.channel} ni:${item.noteNumber} v:${item.velocity} p:${item.stepPosition.toFixed(2)} d:${item.stepDuration.toFixed(2)}`}
          </div>
        </div>
      ))}
    </div>
  );
};

const BlockView = () => {
  const { blockNodes, blockNodeSelectionIndex } = store.useSnapshot();
  return (
    <div className="border border-[#888] min-w-[300px] min-h-[100px] max-h-[600px] overflow-scroll p-2 relative">
      {blockNodes?.map((node, index) => {
        const uw = 16;
        const uh = 8;
        const qx = node.type === "note" ? (node.noteNumber / 127) * 200 : 0;
        const qy = node.stepPosition * uh;
        const qh = node.type === "note" ? node.stepDuration * uh : uh;
        const text = node.type === "note" ? node.noteNumber : undefined;
        const hint =
          node.type === "command"
            ? node.bytes.map((b) => b.toString(16).padStart(2, "0")).join(" ")
            : undefined;
        const selected = blockNodeSelectionIndex === index;
        return (
          <div
            key={index.toString()}
            css={{
              position: "absolute",
              left: npx(qx),
              top: npx(qy),
              width: npx(uw),
              height: npx(qh),
              border: "1px solid #ccc",
              fontSize: "8px",
              backgroundColor: selected ? "#ccffcc" : "#fff0",
              cursor: "pointer",
            }}
            title={hint}
            onClick={() => {
              store.mutations.setBlockNodeSelectionIndex(index);
            }}
          >
            {text}
          </div>
        );
      })}
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
        <div className="flex-h">
          <CommandListView />
          <OutlineView />
          <BlockNodeListColumn />
          <BlockView />
        </div>
      </div>
    </div>
  );
};

mountAppRoot(<App />, "app");
