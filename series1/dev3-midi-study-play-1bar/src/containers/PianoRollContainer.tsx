import { PianoRoll } from "@/components/PianoRoll";
import type { PlaybackController } from "@/lib/playback";
import { buildPlaybackEvents, buildSliceExport } from "@/lib/slice";
import { setSelectedBar } from "@/store/appSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

interface PianoRollContainerProps {
  playbackController: PlaybackController;
}

export function PianoRollContainer(props: PianoRollContainerProps) {
  const { playbackController } = props;
  const dispatch = useAppDispatch();
  const {
    activeTrackIds,
    isPlaying,
    previewEnabled,
    selectedBar,
    selectedBarLength,
    song,
  } = useAppSelector((state) => state.app);

  if (!song) {
    return null;
  }

  const handleBarClick = (barIndex: number) => {
    if (isPlaying) {
      playbackController.stop();
      return;
    }

    dispatch(setSelectedBar(barIndex));

    const sliceExport = buildSliceExport(
      song,
      activeTrackIds,
      barIndex,
      selectedBarLength,
    );
    console.log(JSON.stringify(sliceExport, null, 2));

    if (!previewEnabled) {
      return;
    }

    const playbackEvents = buildPlaybackEvents(
      song,
      activeTrackIds,
      barIndex,
      selectedBarLength,
    );
    playbackController.play(playbackEvents);
  };

  return (
    <PianoRoll
      song={song}
      activeTrackIds={activeTrackIds}
      selectedBar={selectedBar}
      selectedBarLength={selectedBarLength}
      onBarClick={handleBarClick}
    />
  );
}
