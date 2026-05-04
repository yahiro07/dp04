import { TrackList } from "@/components/TrackList";
import { createTrackListItems } from "@/lib/view-model-support";
import { soloChannel, toggleChannel } from "@/store/appSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function TrackListContainer() {
  const dispatch = useAppDispatch();
  const { activeChannels, song } = useAppSelector((state) => state.app);

  if (!song) {
    return null;
  }

  const items = createTrackListItems(song.tracks, activeChannels);

  return (
    <TrackList
      items={items}
      onToggleTrack={(channel) => dispatch(toggleChannel(channel))}
      onSoloTrack={(channel) => dispatch(soloChannel(channel))}
    />
  );
}
