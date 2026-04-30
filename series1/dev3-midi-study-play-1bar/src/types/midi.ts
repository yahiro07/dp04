export type BarLength = 1 | 2 | 4;

export interface MidiNoteEvent {
  id: string;
  noteNumber: number;
  velocity: number;
  startTick: number;
  durationTicks: number;
  endTick: number;
  startStep: number;
  durationSteps: number;
  endStep: number;
  startBar: number;
  channel: number;
}

export interface InstrumentInfo {
  channel: number;
  program: number;
}

export interface TrackData {
  id: string;
  index: number;
  name: string;
  color: string;
  channelPrograms: Record<number, number>;
  notes: MidiNoteEvent[];
}

export interface NoteRange {
  minNoteNumber: number;
  maxNoteNumber: number;
  minOctave: number;
  maxOctave: number;
}

export interface ParsedMidiSong {
  fileName: string;
  bpm: number;
  ppq: number;
  ticksPerQuarter: number;
  ticksPerStep: number;
  ticksPerBar: number;
  offsetTicks: number;
  totalBars: number;
  totalSteps: number;
  range: NoteRange;
  tracks: TrackData[];
}

export interface SliceTrackNote {
  position: number;
  duration: number;
  noteNumber: number;
  velocity: number;
}

export interface SliceTrackExport {
  trackId: string;
  trackName: string;
  channelPrograms: InstrumentInfo[];
  notes: SliceTrackNote[];
}

export interface SliceExport {
  tempo: number;
  startBar: number;
  barLength: BarLength;
  tracks: SliceTrackExport[];
}

export interface PlaybackEvent {
  channel: number;
  program: number;
  noteNumber: number;
  velocity: number;
  startSeconds: number;
  endSeconds: number;
}
