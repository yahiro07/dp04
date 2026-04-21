import { useRef, useState } from "react";

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
