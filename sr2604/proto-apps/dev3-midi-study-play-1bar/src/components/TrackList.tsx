import type { TrackListItemViewModel } from "@/lib/view-model-support";

interface TrackListProps {
  items: TrackListItemViewModel[];
  onToggleTrack: (channel: number) => void;
  onSoloTrack: (channel: number) => void;
}

export function TrackList(props: TrackListProps) {
  const { items, onSoloTrack, onToggleTrack } = props;

  return (
    <aside className="w-64 shrink-0 border-r border-stone-300 bg-stone-50">
      <div className="border-b border-stone-300 px-4 py-3 text-sm font-semibold text-stone-900">
        Channels
      </div>
      <div className="flex flex-col gap-2 p-3">
        {items.map((item) => {
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700"
            >
              <span
                className="h-4 w-4 rounded-sm border border-stone-400"
                style={{ backgroundColor: item.color }}
              />
              <label className="flex min-w-0 flex-1 items-center gap-3">
                <input
                  checked={item.isActive}
                  onChange={() => onToggleTrack(item.channel)}
                  type="checkbox"
                />
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
              </label>
              <button
                aria-label={`${item.name} solo`}
                className="flex h-7 w-7 items-center justify-center rounded border border-stone-400 bg-stone-100 text-xs font-semibold text-stone-700 transition hover:bg-stone-200"
                onClick={() => onSoloTrack(item.channel)}
                type="button"
              >
                S
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
