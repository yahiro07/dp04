import type { TrackData } from "@/types/midi";

interface TrackListProps {
  tracks: TrackData[];
  activeTrackIds: string[];
  onToggleTrack: (trackId: string) => void;
}

export function TrackList(props: TrackListProps) {
  const { activeTrackIds, onToggleTrack, tracks } = props;

  return (
    <aside className="w-64 shrink-0 border-r border-stone-300 bg-stone-50">
      <div className="border-b border-stone-300 px-4 py-3 text-sm font-semibold text-stone-900">
        Tracks
      </div>
      <div className="flex flex-col gap-2 p-3">
        {tracks.map((track) => {
          const active = activeTrackIds.includes(track.id);

          return (
            <label
              key={track.id}
              className="flex items-center gap-3 rounded border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700"
            >
              <span
                className="h-4 w-4 rounded-sm border border-stone-400"
                style={{ backgroundColor: track.color }}
              />
              <input
                checked={active}
                onChange={() => onToggleTrack(track.id)}
                type="checkbox"
              />
              <span className="min-w-0 flex-1 truncate">{track.name}</span>
            </label>
          );
        })}
      </div>
    </aside>
  );
}
