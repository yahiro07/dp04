import type { TrackListItemViewModel } from "@/lib/view-model-support";

interface TrackListProps {
  items: TrackListItemViewModel[];
  onToggleTrack: (trackId: string) => void;
}

export function TrackList(props: TrackListProps) {
  const { items, onToggleTrack } = props;

  return (
    <aside className="w-64 shrink-0 border-r border-stone-300 bg-stone-50">
      <div className="border-b border-stone-300 px-4 py-3 text-sm font-semibold text-stone-900">
        Tracks
      </div>
      <div className="flex flex-col gap-2 p-3">
        {items.map((item) => {
          return (
            <label
              key={item.id}
              className="flex items-center gap-3 rounded border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700"
            >
              <span
                className="h-4 w-4 rounded-sm border border-stone-400"
                style={{ backgroundColor: item.color }}
              />
              <input
                checked={item.isActive}
                onChange={() => onToggleTrack(item.id)}
                type="checkbox"
              />
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
            </label>
          );
        })}
      </div>
    </aside>
  );
}
