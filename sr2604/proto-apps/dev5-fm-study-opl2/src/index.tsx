import { createStore } from "snap-store";
import { Button } from "@/components/button";
import { mountAppRoot } from "@/utils/mount-app-root";
import "./styling/page.css";
import "./styling/utility-classes.css";
import { useEffect } from "react";
import { applyVgmDataHint } from "@/vgm-data-hint-applier";
import { createVgmFileDataManager } from "@/vgm-file-data-manager";
import { VgmSong } from "@/vgm-parser";

const store = createStore<{ vgmData: VgmSong | undefined }>({
  vgmData: undefined,
});

const storeActions = {
  setVgmData(vgmData: VgmSong) {
    console.log(vgmData.header);
    applyVgmDataHint(vgmData);
    store.setVgmData(vgmData);
  },
  clearVgmData(errorMessage?: string) {
    store.setVgmData(undefined);
  },
};

const vgmFileDataManager = createVgmFileDataManager({
  songLoadedCallback: storeActions.setVgmData,
  loadFailureCallback: storeActions.clearVgmData,
  clearCallback: storeActions.clearVgmData,
});

const CommandListView = () => {
  const { vgmData } = store.useSnapshot();
  if (!vgmData) return null;

  const { header, commands } = vgmData;

  return (
    <div>
      <div>{`header version=${header.version} length=${header.headerLength}`}</div>
      {commands.map((command, index) => (
        <div key={index.toString()} className="flex-ha gap-2">
          <div className="min-w-[100px]">
            {[...command.bytes.values()]
              .map((b) => b.toString(16).padStart(2, "0"))
              .join(" ")}
          </div>
          {command.comment ? (
            <div className="text-[#aaa]">{command.comment}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
};

const App = () => {
  useEffect(() => {
    vgmFileDataManager.restoreFileFromSession();
  }, []);
  return (
    <div className="w-dvw h-dvh p-2">
      <div className="flex-ha gap-2">
        <Button onClick={vgmFileDataManager.loadFileWithDialog}>load</Button>
        <Button onClick={vgmFileDataManager.clearFileLoaded}>clear</Button>
        <div className="text-[#666]">
          load vgm or vgz file, only OPL2 (YM3812) supported
        </div>
      </div>
      <CommandListView />
    </div>
  );
};

mountAppRoot(<App />, "app");
