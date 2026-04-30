import { TrackList } from "@/components/TrackList";
import { createTrackListItems } from "@/lib/view-model-support";
import { toggleTrack } from "@/store/appSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function TrackListContainer() {
  const dispatch = useAppDispatch();
  const { activeTrackIds, song } = useAppSelector((state) => state.app);

  if (!song) {
    return null;
  }

  const items = createTrackListItems(song.tracks, activeTrackIds);

  return (
    <TrackList
      items={items}
      onToggleTrack={(trackId) => dispatch(toggleTrack(trackId))}
    />
  );
}
