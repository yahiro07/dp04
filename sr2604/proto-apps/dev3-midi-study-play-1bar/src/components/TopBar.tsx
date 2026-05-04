import type { ChangeEvent } from "react";
import type { TopBarViewModel } from "@/lib/view-model-support";
import type { BarLength } from "@/types/midi";

interface TopBarProps {
  viewModel: TopBarViewModel;
  onLoadClick: () => void;
  onPreviewChange: (enabled: boolean) => void;
  onBarLengthChange: (value: BarLength) => void;
}

export function TopBar(props: TopBarProps) {
  const { onBarLengthChange, onLoadClick, onPreviewChange, viewModel } = props;
  const {
    bpmText,
    fileNameText,
    isLoading,
    previewEnabled,
    rangeText,
    selectedBarLength,
  } = viewModel;

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onBarLengthChange(Number(event.target.value) as BarLength);
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

        <div className="min-w-28 text-sm text-stone-700">BPM: {bpmText}</div>
        <div className="min-w-40 text-sm text-stone-700">
          Range: {rangeText}
        </div>
        <div className="truncate text-sm text-stone-500">{fileNameText}</div>
      </div>
    </header>
  );
}
