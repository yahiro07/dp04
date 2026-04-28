import { FileDataPersistence } from "@/file-data-persistence";
import { SmfReader } from "@/smf-reader";
import { SmfSong } from "@/types";
import { openFilePicker } from "@/utils/file-picker-utils";

type SmfFileDataManager = {
  loadSmfFile: (droppedFile: File) => Promise<void>;
  loadSfmFileWithDialog: () => void;
  restoreSmfFileFromSession: () => void;
  clearSmfFileLoaded: () => void;
};

export function createSmfFileDataManager(options: {
  songLoadedCallback: (song: SmfSong) => void;
  loadFailureCallback: (message: string) => void;
  clearCallback: () => void;
}): SmfFileDataManager {
  const loadSmfFile = async (droppedFile: File) => {
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
      options.songLoadedCallback(song);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to parse MIDI file";
      options.loadFailureCallback(message);
    }
  };

  return {
    loadSmfFile,
    loadSfmFileWithDialog() {
      openFilePicker({
        accept: ".mid,.midi,audio/midi,audio/x-midi",
        onFileSelect: loadSmfFile,
      });
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
        options.songLoadedCallback(song);
      } catch (error) {
        FileDataPersistence.clearFileBytes();
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to restore MIDI file from sessionStorage";
        options.loadFailureCallback(errorMessage);
      }
    },
    clearSmfFileLoaded() {
      FileDataPersistence.clearFileBytes();
      options.clearCallback();
    },
  };
}
