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

        if (lowerName.endsWith(".vgz")) {
          if (typeof DecompressionStream === "undefined") {
            throw new Error("This browser does not support gzip decompression.");
          }

          const decompressedStream = new Blob([rawBytes])
            .stream()
            .pipeThrough(new DecompressionStream("gzip"));
          const decompressedBuffer = await new Response(
            decompressedStream,
          ).arrayBuffer();
          const decompressedBytes = new Uint8Array(decompressedBuffer);

          console.log(decompressedBytes);
          return;
        }

        console.log(rawBytes);
      } catch (error) {
        console.error("Failed to load VGM/VGZ file:", error);
      }
    };

    input.click();
  },
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
    </div>
  );
};

mountAppRoot(<App />, "app");
