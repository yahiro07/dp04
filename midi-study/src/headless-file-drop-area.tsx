import { useEffect, useRef, useState } from "react";

const dragEventHasFiles = (dataTransfer: DataTransfer | null) => {
  if (!dataTransfer) return false;
  return Array.from(dataTransfer.types).includes("Files");
};

export const HeadlessFileDropArea = ({
  accept,
  onDropFile,
  renderContent,
}: {
  accept: string;
  onDropFile: (file: File) => void;
  renderContent: ({ isDragging }: { isDragging: boolean }) => React.ReactNode;
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(event) => {
          event.currentTarget.value = "";
          const file = event.target.files?.[0];
          if (!file) return;
          onDropFile(file);
        }}
      />
      <div
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
          const file = event.dataTransfer.files?.[0];
          if (!file) return;
          onDropFile(file);
        }}
      >
        {renderContent({ isDragging })}
      </div>
    </>
  );
};

export const HeadlessFileDropArea_DropOnly = ({
  className,
  onDropFile,
  renderContent,
}: {
  className?: string;
  onDropFile: (file: File) => void;
  renderContent: ({ isDragging }: { isDragging: boolean }) => React.ReactNode;
}) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      className={className}
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
        const file = event.dataTransfer.files?.[0];
        if (!file) return;
        onDropFile(file);
      }}
    >
      {renderContent({ isDragging })}
    </div>
  );
};

export const HeadlessFileDropArea_WindowCovered = ({
  className,
  onDropFile,
  renderContent,
}: {
  className?: string;
  onDropFile: (file: File) => void;
  renderContent: ({ isDragging }: { isDragging: boolean }) => React.ReactNode;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragDepthRef = useRef(0);

  useEffect(() => {
    const handleWindowDragEnter = (event: DragEvent) => {
      if (!dragEventHasFiles(event.dataTransfer)) return;
      event.preventDefault();
      dragDepthRef.current += 1;
      setIsDragging(true);
    };

    const handleWindowDragOver = (event: DragEvent) => {
      if (!dragEventHasFiles(event.dataTransfer)) return;
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
      setIsDragging(true);
    };

    const handleWindowDragLeave = (event: DragEvent) => {
      if (!dragEventHasFiles(event.dataTransfer)) return;
      event.preventDefault();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) {
        setIsDragging(false);
      }
    };

    const handleWindowDrop = (event: DragEvent) => {
      if (!dragEventHasFiles(event.dataTransfer)) return;
      event.preventDefault();
      dragDepthRef.current = 0;
      setIsDragging(false);

      const file = event.dataTransfer?.files?.[0];
      if (!file) return;
      onDropFile(file);
    };

    const resetDragging = () => {
      dragDepthRef.current = 0;
      setIsDragging(false);
    };

    window.addEventListener("dragenter", handleWindowDragEnter);
    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("dragleave", handleWindowDragLeave);
    window.addEventListener("drop", handleWindowDrop);
    window.addEventListener("blur", resetDragging);

    return () => {
      window.removeEventListener("dragenter", handleWindowDragEnter);
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("dragleave", handleWindowDragLeave);
      window.removeEventListener("drop", handleWindowDrop);
      window.removeEventListener("blur", resetDragging);
    };
  }, [onDropFile]);

  return (
    <div
      className={className}
      css={{
        pointerEvents: isDragging ? "auto" : "none",
      }}
    >
      {renderContent({ isDragging })}
    </div>
  );
};
