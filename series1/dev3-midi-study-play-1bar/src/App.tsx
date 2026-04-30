import { useEffect, useMemo, useRef } from "react";
import { PianoRoll } from "@/components/PianoRoll";
import { TopBar } from "@/components/TopBar";
import { TrackList } from "@/components/TrackList";
import { formatOctaveRange } from "@/lib/formatters";
import { createPlaybackController } from "@/lib/playback";
import { buildPlaybackEvents, buildSliceExport } from "@/lib/slice";
import {
  loadMidiFile,
  setPlaying,
  setPreviewEnabled,
  setSelectedBar,
  setSelectedBarLength,
  toggleTrack,
} from "@/store/appSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

function isMidiFile(file: File) {
  const lowerName = file.name.toLowerCase();
  return (
    lowerName.endsWith(".mid") ||
    lowerName.endsWith(".midi") ||
    file.type === "audio/midi"
  );
}

function pickMidiFile(fileList: FileList | null) {
  if (!fileList) {
    return null;
  }

  return Array.from(fileList).find(isMidiFile) ?? null;
}

export default function App() {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const playbackRef = useRef(
    createPlaybackController({
      onPlaybackStateChange: (nextIsPlaying) => {
        dispatch(setPlaying(nextIsPlaying));
      },
    }),
  );

  const {
    activeTrackIds,
    error,
    isPlaying,
    previewEnabled,
    selectedBar,
    selectedBarLength,
    song,
    status,
  } = useAppSelector((state) => state.app);

  const isLoading = status === "loading";
  const dropMessage = useMemo(() => {
    if (!song) {
      return "Load a MIDI file to render the piano roll.";
    }

    return `${song.tracks.length} tracks, BPM ${song.bpm}, range ${formatOctaveRange(song.range)}`;
  }, [song]);

  useEffect(() => {
    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
    };

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      const file = pickMidiFile(event.dataTransfer?.files ?? null);

      if (file) {
        void dispatch(loadMidiFile(file));
      }
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [dispatch]);

  useEffect(() => {
    return () => {
      playbackRef.current.stop();
    };
  }, []);

  const handleFileChange = (fileList: FileList | null) => {
    const file = pickMidiFile(fileList);

    if (file) {
      playbackRef.current.stop();
      void dispatch(loadMidiFile(file));
    }
  };

  const handleBarClick = (barIndex: number) => {
    if (!song) {
      return;
    }

    if (isPlaying) {
      playbackRef.current.stop();
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
    playbackRef.current.play(playbackEvents);
  };

  return (
    <div className="min-h-screen text-stone-900">
      <input
        ref={fileInputRef}
        className="hidden"
        type="file"
        accept=".mid,.midi,audio/midi"
        onChange={(event) => handleFileChange(event.target.files)}
      />

      <TopBar
        song={song}
        isLoading={isLoading}
        previewEnabled={previewEnabled}
        selectedBarLength={selectedBarLength}
        onLoadClick={() => fileInputRef.current?.click()}
        onPreviewChange={(enabled) => dispatch(setPreviewEnabled(enabled))}
        onBarLengthChange={(value) => dispatch(setSelectedBarLength(value))}
      />

      <main className="flex min-h-[calc(100vh-61px)]">
        {song ? (
          <>
            <TrackList
              tracks={song.tracks}
              activeTrackIds={activeTrackIds}
              onToggleTrack={(trackId) => dispatch(toggleTrack(trackId))}
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="border-b border-stone-300 bg-stone-100 px-4 py-2 text-sm text-stone-600">
                {dropMessage}
              </div>
              <PianoRoll
                song={song}
                activeTrackIds={activeTrackIds}
                selectedBar={selectedBar}
                selectedBarLength={selectedBarLength}
                onBarClick={handleBarClick}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6">
            <div className="max-w-xl rounded border border-dashed border-stone-400 bg-white/80 px-8 py-10 text-center shadow-sm">
              <div className="text-lg font-semibold">
                MIDI Piano Roll Viewer
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                Use the Load button or drop a MIDI file anywhere in the window.
                The app will parse tempo, notes, and program changes, then
                render all tracks into a single piano roll.
              </p>
              {error ? (
                <p className="mt-4 text-sm text-red-600">{error}</p>
              ) : null}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
