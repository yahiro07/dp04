import { TrackList } from "@/components/TrackList";
import { toggleTrack } from "@/store/appSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function TrackListContainer() {
  const dispatch = useAppDispatch();
  const { activeTrackIds, song } = useAppSelector((state) => state.app);

  if (!song) {
    return null;
  }

  return (
    <TrackList
      tracks={song.tracks}
      activeTrackIds={activeTrackIds}
      onToggleTrack={(trackId) => dispatch(toggleTrack(trackId))}
    />
  );
}
