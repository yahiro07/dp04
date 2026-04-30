import { PianoRoll } from "@/components/PianoRoll";
import {
  createPianoRollViewModel,
  resolvePianoRollBarSelection,
} from "@/lib/piano-roll-support";
import type { PlaybackController } from "@/lib/playback";
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

  const viewModel = createPianoRollViewModel({
    song,
    activeTrackIds,
    selectedBar,
    selectedBarLength,
  });

  const handleBarClick = (barIndex: number) => {
    const result = resolvePianoRollBarSelection({
      song,
      activeTrackIds,
      barIndex,
      selectedBarLength,
      previewEnabled,
      isPlaying,
    });

    if (result.shouldStopPlayback) {
      playbackController.stop();
      return;
    }

    dispatch(setSelectedBar(result.nextSelectedBar));

    if (result.sliceExport) {
      console.log(JSON.stringify(result.sliceExport, null, 2));
    }

    if (result.playbackEvents.length > 0) {
      playbackController.play(result.playbackEvents);
    }
  };

  return <PianoRoll viewModel={viewModel} onBarClick={handleBarClick} />;
}
