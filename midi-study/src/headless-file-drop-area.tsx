import { useRef, useState } from "react";

export const HeadlessFileDropArea = ({
  accept,
  onDrop,
  renderContent,
}: {
  accept: string;
  onDrop: (file: File | null | undefined) => void;
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
          onDrop(event.target.files?.[0]);
          event.currentTarget.value = "";
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
          onDrop(event.dataTransfer.files?.[0]);
        }}
      >
        {renderContent({ isDragging })}
      </div>
    </>
  );
};
