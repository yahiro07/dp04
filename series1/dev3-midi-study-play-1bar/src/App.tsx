import { useCallback, useEffect, useMemo, useRef } from "react";
import { PianoRollContainer } from "@/containers/PianoRollContainer";
import { TopBarContainer } from "@/containers/TopBarContainer";
import { TrackListContainer } from "@/containers/TrackListContainer";
import {
  createWindowMidiDropHandlers,
  pickMidiFile,
} from "@/lib/file-loading-support";
import { formatOctaveRange } from "@/lib/formatters";
import { createPlaybackController } from "@/lib/playback";
import { loadMidiFile, setPlaying } from "@/store/appSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

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

  const { error, song } = useAppSelector((state) => state.app);
  const dropMessage = useMemo(() => {
    if (!song) {
      return "Load a MIDI file to render the piano roll.";
    }

    return `${song.tracks.length} tracks, BPM ${song.bpm}, range ${formatOctaveRange(song.range)}`;
  }, [song]);

  const handleMidiFileLoad = useCallback(
    (file: File) => {
      playbackRef.current.stop();
      void dispatch(loadMidiFile(file));
    },
    [dispatch],
  );

  useEffect(() => {
    const dropHandlers = createWindowMidiDropHandlers(handleMidiFileLoad);
    dropHandlers.register();

    return () => {
      dropHandlers.unregister();
    };
  }, [handleMidiFileLoad]);

  useEffect(() => {
    return () => {
      playbackRef.current.stop();
    };
  }, []);

  const handleFileChange = (fileList: FileList | null) => {
    const file = pickMidiFile(fileList);

    if (file) {
      handleMidiFileLoad(file);
    }
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

      <TopBarContainer onLoadClick={() => fileInputRef.current?.click()} />

      <main className="flex min-h-[calc(100vh-61px)]">
        {song ? (
          <>
            <TrackListContainer />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="border-b border-stone-300 bg-stone-100 px-4 py-2 text-sm text-stone-600">
                {dropMessage}
              </div>
              <PianoRollContainer playbackController={playbackRef.current} />
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
