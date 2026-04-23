import { Midi } from "@tonejs/midi";
import { TRACK_COLORS } from "@/constants/colors";
import {
  BEATS_PER_BAR,
  C_NOTE,
  MIDI_NOTES_PER_OCTAVE,
  STEPS_PER_BAR,
  STEPS_PER_BEAT,
} from "@/constants/music";
import type { NoteRange, ParsedMidiSong, TrackData } from "@/types/midi";

function getTempoBpm(midi: Midi): number {
  return midi.header.tempos[0]?.bpm ?? 120;
}

function getTicksPerQuarter(midi: Midi): number {
  return midi.header.ppq;
}

function getTicksPerStep(ticksPerQuarter: number): number {
  return ticksPerQuarter / STEPS_PER_BEAT;
}

function getTicksPerBar(ticksPerQuarter: number): number {
  return ticksPerQuarter * BEATS_PER_BAR;
}

function getOffsetTicks(firstNoteTick: number, ticksPerBar: number): number {
  if (firstNoteTick <= 0) {
    return 0;
  }

  const remainder = firstNoteTick % ticksPerBar;
  return remainder === 0 ? 0 : remainder;
}

function clampStartTick(tick: number): number {
  return tick < 0 ? 0 : tick;
}

function getNoteRange(tracks: TrackData[]): NoteRange {
  const allMidiNotes = tracks.flatMap((track) =>
    track.notes.map((note) => note.midi),
  );

  if (allMidiNotes.length === 0) {
    return {
      minMidi: 60,
      maxMidi: 71,
      minOctave: 5,
      maxOctave: 5,
    };
  }

  const minMidi = Math.min(...allMidiNotes);
  const maxMidi = Math.max(...allMidiNotes);
  const minOctave = Math.floor((minMidi - C_NOTE) / MIDI_NOTES_PER_OCTAVE);
  const maxOctave = Math.floor((maxMidi - C_NOTE) / MIDI_NOTES_PER_OCTAVE);

  return {
    minMidi,
    maxMidi,
    minOctave,
    maxOctave,
  };
}

export async function parseMidiFile(file: File): Promise<ParsedMidiSong> {
  const buffer = await file.arrayBuffer();
  const midi = new Midi(buffer);
  const ticksPerQuarter = getTicksPerQuarter(midi);
  const ticksPerStep = getTicksPerStep(ticksPerQuarter);
  const ticksPerBar = getTicksPerBar(ticksPerQuarter);
  const firstNoteTick = midi.tracks
    .flatMap((track) => track.notes.map((note) => note.ticks))
    .reduce((min, tick) => Math.min(min, tick), Number.POSITIVE_INFINITY);
  const offsetTicks = Number.isFinite(firstNoteTick)
    ? getOffsetTicks(firstNoteTick, ticksPerBar)
    : 0;

  const tracks = midi.tracks
    .map<TrackData | null>((track, trackIndex) => {
      const channelPrograms: Record<number, number> = {};
      const trackChannel = track.channel ?? 0;

      for (const instrument of track.instrument ? [track.instrument] : []) {
        channelPrograms[trackChannel] = instrument.number;
      }

      const notes = track.notes.map((note, noteIndex) => {
        const adjustedStartTick = clampStartTick(note.ticks - offsetTicks);
        const endTick = adjustedStartTick + note.durationTicks;
        const startStep = adjustedStartTick / ticksPerStep;
        const durationSteps = note.durationTicks / ticksPerStep;
        const endStep = startStep + durationSteps;
        const startBar = Math.floor(startStep / STEPS_PER_BAR);

        return {
          id: `${trackIndex}-${noteIndex}`,
          midi: note.midi,
          velocity: Math.round(note.velocity * 127),
          startTick: adjustedStartTick,
          durationTicks: note.durationTicks,
          endTick,
          startStep,
          durationSteps,
          endStep,
          startBar,
          channel: trackChannel,
        };
      });

      if (notes.length === 0) {
        return null;
      }

      return {
        id: `track-${trackIndex}`,
        index: trackIndex,
        name: track.name?.trim() || `Track ${trackIndex + 1}`,
        color: TRACK_COLORS[trackIndex % TRACK_COLORS.length],
        channelPrograms,
        notes,
      };
    })
    .filter((track): track is TrackData => track !== null);

  const range = getNoteRange(tracks);
  const totalSteps = Math.max(
    STEPS_PER_BAR,
    ...tracks.flatMap((track) => track.notes.map((note) => note.endStep)),
  );
  const totalBars = Math.max(1, Math.ceil(totalSteps / STEPS_PER_BAR));

  return {
    fileName: file.name,
    bpm: Math.round(getTempoBpm(midi)),
    ppq: midi.header.ppq,
    ticksPerQuarter,
    ticksPerStep,
    ticksPerBar,
    offsetTicks,
    totalBars,
    totalSteps,
    range,
    tracks,
  };
}
