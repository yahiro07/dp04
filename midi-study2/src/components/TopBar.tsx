import type { ChangeEvent } from "react";
import type { BarLength, ParsedMidiSong } from "@/types/midi";

interface TopBarProps {
  song: ParsedMidiSong | null;
  isLoading: boolean;
  previewEnabled: boolean;
  selectedBarLength: BarLength;
  onLoadClick: () => void;
  onPreviewChange: (enabled: boolean) => void;
  onBarLengthChange: (value: BarLength) => void;
}

function toBarLength(value: string): BarLength {
  if (value === "2") {
    return 2;
  }

  if (value === "4") {
    return 4;
  }

  return 1;
}

export function TopBar(props: TopBarProps) {
  const {
    isLoading,
    onBarLengthChange,
    onLoadClick,
    onPreviewChange,
    previewEnabled,
    selectedBarLength,
    song,
  } = props;

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onBarLengthChange(toBarLength(event.target.value));
  };

  return (
    <header className="sticky top-0 z-20 border-b border-stone-300 bg-stone-50/95 backdrop-blur">
      <div className="flex flex-wrap items-center gap-4 px-4 py-3">
        <button
          className="rounded border border-stone-400 bg-white px-3 py-2 text-sm font-medium text-stone-900 shadow-sm transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onLoadClick}
          type="button"
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Load"}
        </button>

        <label className="flex items-center gap-2 text-sm text-stone-700">
          <span>Bars</span>
          <select
            className="rounded border border-stone-300 bg-white px-2 py-1.5 text-sm"
            value={selectedBarLength}
            onChange={handleSelectChange}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={4}>4</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            checked={previewEnabled}
            onChange={(event) => onPreviewChange(event.target.checked)}
            type="checkbox"
          />
          <span>preview</span>
        </label>

        <div className="min-w-28 text-sm text-stone-700">
          BPM: {song ? song.bpm : "-"}
        </div>
        <div className="min-w-40 text-sm text-stone-700">
          Range:{" "}
          {song
            ? `C${song.range.minOctave - 1} - B${song.range.maxOctave - 1}`
            : "-"}
        </div>
        <div className="truncate text-sm text-stone-500">
          {song ? song.fileName : "Drop a MIDI file anywhere or use Load."}
        </div>
      </div>
    </header>
  );
}
