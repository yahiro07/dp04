import {
  HeadlessFileDropArea,
  HeadlessFileDropArea_DropOnly,
} from "@/headless-file-drop-area";

const MidiFileDropAreaView = ({ isDragging }: { isDragging: boolean }) => (
  <div
    className="flex-vc gap-2 border border-[#888] p-10 border-dashed"
    css={{
      minHeight: 140,
      cursor: "pointer",
      backgroundColor: isDragging ? "#eef6ff" : "#fff",
      transition: "background-color 120ms ease",
    }}
  >
    <div>drop midi file here</div>
    <div css={{ fontSize: 12, color: "#666" }}>
      or click to choose a `.mid` / `.midi` file
    </div>
  </div>
);

export const MidiFileDropArea = ({
  onFileDrop,
}: {
  onFileDrop: (file: File) => void;
}) => {
  return (
    <HeadlessFileDropArea
      accept=".mid,.midi,audio/midi,audio/x-midi"
      onDropFile={onFileDrop}
      renderContent={MidiFileDropAreaView}
    />
  );
};

const FullScreenDropAreaView = ({ isDragging }: { isDragging: boolean }) => {
  if (!isDragging) return;
  return (
    <div
      className="w-full h-full"
      css={{
        border: "3px dashed #08f",
        background: "#08f3",
      }}
    />
  );
};

export const FullScreenMidiFileDropArea = ({
  onFileDrop,
}: {
  onFileDrop: (file: File) => void;
}) => {
  return (
    <HeadlessFileDropArea_DropOnly
      className="absolute left-0 top-0 w-full h-full"
      onDropFile={onFileDrop}
      renderContent={FullScreenDropAreaView}
    />
  );
};
