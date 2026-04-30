import { STEPS_PER_BAR } from "@/constants/music";
import type {
  BarLength,
  ParsedMidiSong,
  PlaybackEvent,
  SliceExport,
  SliceTrackExport,
  TrackData,
} from "@/types/midi";

function getSortedPrograms(track: TrackData) {
  return Object.entries(track.channelPrograms)
    .map(([channel, program]) => ({ channel: Number(channel), program }))
    .sort((left, right) => left.channel - right.channel);
}

export function getSliceSteps(startBar: number, barLength: BarLength) {
  const startStep = startBar * STEPS_PER_BAR;
  const endStep = startStep + barLength * STEPS_PER_BAR;
  return { startStep, endStep };
}

export function buildSliceExport(
  song: ParsedMidiSong,
  activeTrackIds: string[],
  startBar: number,
  barLength: BarLength,
): SliceExport {
  const { startStep, endStep } = getSliceSteps(startBar, barLength);

  const tracks: SliceTrackExport[] = song.tracks
    .filter((track) => activeTrackIds.includes(track.id))
    .map((track) => ({
      trackId: track.id,
      trackName: track.name,
      channelPrograms: getSortedPrograms(track),
      notes: track.notes
        .filter(
          (note) => note.startStep >= startStep && note.startStep < endStep,
        )
        .map((note) => ({
          position: note.startStep - startStep,
          duration: note.durationSteps,
          noteNumber: note.noteNumber,
          velocity: note.velocity,
        })),
    }))
    .filter((track) => track.notes.length > 0);

  return {
    tempo: song.bpm,
    startBar,
    barLength,
    tracks,
  };
}

export function buildPlaybackEvents(
  song: ParsedMidiSong,
  activeTrackIds: string[],
  startBar: number,
  barLength: BarLength,
): PlaybackEvent[] {
  const { startStep, endStep } = getSliceSteps(startBar, barLength);
  const secondsPerBeat = 60 / song.bpm;
  const secondsPerStep = secondsPerBeat / 4;

  return song.tracks
    .filter((track) => activeTrackIds.includes(track.id))
    .flatMap((track) =>
      track.notes
        .filter(
          (note) => note.startStep >= startStep && note.startStep < endStep,
        )
        .map((note) => ({
          channel: note.channel,
          program: track.channelPrograms[note.channel] ?? 0,
          noteNumber: note.noteNumber,
          velocity: note.velocity,
          startSeconds: (note.startStep - startStep) * secondsPerStep,
          endSeconds:
            (note.startStep - startStep + note.durationSteps) * secondsPerStep,
        })),
    )
    .sort(
      (left, right) =>
        left.startSeconds - right.startSeconds ||
        left.noteNumber - right.noteNumber,
    );
}
