import { createStore } from "snap-store";
import { Button } from "@/components/button";
import { mountAppRoot } from "@/utils/mount-app-root";
import "./styling/page.css";
import "./styling/utility-classes.css";
import { VgmData, vgmParser } from "@/vgm-parser";

const store = createStore<{ vgmData: VgmData | null }>({
  vgmData: null,
});

const actions = {
  async loadVgmFileWithDialog() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".vgm,.vgz";

    input.onchange = async () => {
      const file = input.files?.[0];

      if (!file) return;

      const lowerName = file.name.toLowerCase();

      if (!lowerName.endsWith(".vgm") && !lowerName.endsWith(".vgz")) {
        console.error("Unsupported file type:", file.name);
        return;
      }

      try {
        const rawBytes = new Uint8Array(await file.arrayBuffer());
        let vgmBytes = rawBytes;

        if (lowerName.endsWith(".vgz")) {
          if (typeof DecompressionStream === "undefined") {
            throw new Error(
              "This browser does not support gzip decompression.",
            );
          }

          const decompressedStream = new Blob([rawBytes])
            .stream()
            .pipeThrough(new DecompressionStream("gzip"));
          const decompressedBuffer = await new Response(
            decompressedStream,
          ).arrayBuffer();
          vgmBytes = new Uint8Array(decompressedBuffer);
        }

        const decodedVgmData = vgmParser.decodeVgmData(vgmBytes);
        const decoratedVgmData = vgmParser.decorateWithComments(decodedVgmData);

        store.setVgmData(decoratedVgmData);
        console.log(decoratedVgmData);
      } catch (error) {
        console.error("Failed to load VGM/VGZ file:", error);
      }
    };

    input.click();
  },
};

const CommandListView = () => {
  const { vgmData } = store.useSnapshot();
  if (!vgmData) return null;

  const { header, commands } = vgmData;

  return (
    <div>
      <div>{`header version=${header.version} length=${header.headerLength}`}</div>
      {commands.map((command, index) => (
        <div key={index.toString()}>
          <div>
            {[...command.bytes.values()]
              .map((b) => b.toString(16).padStart(2, "0"))
              .join(" ")}
          </div>
          {command.comment ? <div>{command.comment}</div> : null}
        </div>
      ))}
    </div>
  );
};

const App = () => {
  return (
    <div className="w-dvw h-dvh p-2">
      <div className="flex-ha gap-2">
        <Button onClick={actions.loadVgmFileWithDialog}>load</Button>
        <div className="text-[#666]">
          load vgm or vgz file, only OPL2 (YM3812) supported
        </div>
      </div>
      <CommandListView />
    </div>
  );
};

mountAppRoot(<App />, "app");
