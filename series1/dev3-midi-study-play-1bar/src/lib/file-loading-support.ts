export function isMidiFile(file: File) {
  const lowerName = file.name.toLowerCase();
  return (
    lowerName.endsWith(".mid") ||
    lowerName.endsWith(".midi") ||
    file.type === "audio/midi"
  );
}

export function pickMidiFile(fileList: FileList | null) {
  if (!fileList) {
    return null;
  }

  return Array.from(fileList).find(isMidiFile) ?? null;
}

export function createWindowMidiDropHandlers(onFileDrop: (file: File) => void) {
  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();

    const file = pickMidiFile(event.dataTransfer?.files ?? null);
    if (!file) {
      return;
    }

    onFileDrop(file);
  };

  return {
    register() {
      window.addEventListener("dragover", handleDragOver);
      window.addEventListener("drop", handleDrop);
    },
    unregister() {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    },
  };
}