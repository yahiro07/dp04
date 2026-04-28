import { createFileDataPersistence } from "@/utils/file-data-persistence";
import { openFilePicker } from "@/utils/file-picker-utils";
import { VgmSong, vgmParser } from "@/vgm-parser";

type VgmFileDataManager = {
  loadFile: (droppedFile: File) => Promise<void>;
  loadFileWithDialog: () => void;
  restoreFileFromSession: () => void;
  clearFileLoaded: () => void;
};

export function createVgmFileDataManager(options: {
  songLoadedCallback: (vgmSong: VgmSong) => void;
  loadFailureCallback: (message: string) => void;
  clearCallback: () => void;
}): VgmFileDataManager {
  const fileDataPersistence = createFileDataPersistence(
    "fm-study-opl2:vgm-file-bytes",
  );

  const loadVgmFile = async (droppedFile: File) => {
    try {
      const lowerName = droppedFile.name.toLowerCase();
      const isVgmFile =
        lowerName.endsWith(".vgm") || lowerName.endsWith(".vgz");

      if (!isVgmFile) {
        throw new Error("Please choose a VGM/VGZ file (.vgm or .vgz)");
      }

      let fileBytes = new Uint8Array(await droppedFile.arrayBuffer());

      if (lowerName.endsWith(".vgz")) {
        if (typeof DecompressionStream === "undefined") {
          throw new Error("This browser does not support gzip decompression.");
        }

        const decompressedStream = new Blob([fileBytes])
          .stream()
          .pipeThrough(new DecompressionStream("gzip"));
        const decompressedBuffer = await new Response(
          decompressedStream,
        ).arrayBuffer();
        fileBytes = new Uint8Array(decompressedBuffer);
      }

      const song = vgmParser.decodeVgmData(fileBytes);
      fileDataPersistence.saveFileBytes(fileBytes);
      options.songLoadedCallback(song);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to parse VGM file";
      options.loadFailureCallback(message);
    }
  };

  return {
    loadFile: loadVgmFile,
    loadFileWithDialog() {
      openFilePicker({
        accept: ".vgm,.vgz",
        onFileSelect: loadVgmFile,
      });
    },
    restoreFileFromSession() {
      try {
        const fileBytes = fileDataPersistence.loadFileBytes();
        if (!fileBytes) {
          return;
        }
        const song = vgmParser.decodeVgmData(fileBytes);
        options.songLoadedCallback(song);
      } catch (error) {
        fileDataPersistence.clearFileBytes();
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to restore VGM file from sessionStorage";
        options.loadFailureCallback(errorMessage);
      }
    },
    clearFileLoaded() {
      fileDataPersistence.clearFileBytes();
      options.clearCallback();
    },
  };
}
