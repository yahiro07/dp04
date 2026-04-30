import { STEPS_PER_BAR } from "@/constants/music";
import { formatNoteName } from "@/lib/formatters";
import { buildPlaybackEvents, buildSliceExport } from "@/lib/slice";
import type {
  BarLength,
  ParsedMidiSong,
  PlaybackEvent,
  SliceExport,
} from "@/types/midi";

const STEP_WIDTH = 22;
const ROW_HEIGHT = 20;
const LABEL_WIDTH = 72;

export interface PianoRollBarViewModel {
  key: string;
  barIndex: number;
  label: string;
  left: number;
  width: number;
  borderClass: string;
  isHighlighted: boolean;
}

export interface PianoRollRowViewModel {
  key: string;
  label: string;
  borderClass: string;
  top: number;
  height: number;
}

export interface PianoRollNoteViewModel {
  id: string;
  title: string;
  top: number;
  left: number;
  width: number;
  height: number;
  borderColor: string;
  backgroundColor: string;
}

export interface PianoRollViewModel {
  containerWidth: number;
  containerMinHeight: number;
  gridWidth: number;
  gridHeight: number;
  headerHeight: number;
  labelWidth: number;
  noteLabels: PianoRollRowViewModel[];
  gridRows: PianoRollRowViewModel[];
  headerBars: PianoRollBarViewModel[];
  gridBars: PianoRollBarViewModel[];
  notes: PianoRollNoteViewModel[];
}

interface CreatePianoRollViewModelParams {
  song: ParsedMidiSong;
  activeTrackIds: string[];
  selectedBar: number | null;
  selectedBarLength: BarLength;
}

interface PianoRollBarSelectionParams {
  song: ParsedMidiSong;
  activeTrackIds: string[];
  barIndex: number;
  selectedBarLength: BarLength;
  previewEnabled: boolean;
  isPlaying: boolean;
}

export interface PianoRollBarSelectionResult {
  shouldStopPlayback: boolean;
  nextSelectedBar: number | null;
  sliceExport: SliceExport | null;
  playbackEvents: PlaybackEvent[];
}

function getBarBorderClass(barIndex: number) {
  if (barIndex % 16 === 0) {
    return "border-stone-800";
  }

  if (barIndex % 8 === 0) {
    return "border-stone-600";
  }

  if (barIndex % 4 === 0) {
    return "border-stone-400";
  }

  return "border-stone-300";
}

function isHighlightedBar(
  barIndex: number,
  selectedBar: number | null,
  selectedBarLength: BarLength,
) {
  return (
    selectedBar !== null &&
    barIndex >= selectedBar &&
    barIndex < selectedBar + selectedBarLength
  );
}

export function createPianoRollViewModel(
  params: CreatePianoRollViewModelParams,
): PianoRollViewModel {
  const { activeTrackIds, selectedBar, selectedBarLength, song } = params;
  const midiRows = [] as number[];

  for (
    let midi = song.range.maxOctave * 12 + 11;
    midi >= song.range.minOctave * 12;
    midi -= 1
  ) {
    midiRows.push(midi);
  }

  const gridWidth = song.totalBars * STEPS_PER_BAR * STEP_WIDTH;
  const gridHeight = midiRows.length * ROW_HEIGHT;

  const noteLabels = midiRows.map((midi) => ({
    key: `label-${midi}`,
    label: formatNoteName(midi),
    borderClass: midi % 12 === 11 ? "border-stone-500" : "border-stone-200",
    top: 0,
    height: ROW_HEIGHT,
  }));

  const gridRows = midiRows.map((midi, rowIndex) => ({
    key: `row-${midi}`,
    label: formatNoteName(midi),
    borderClass: midi % 12 === 11 ? "border-stone-500" : "border-stone-200",
    top: rowIndex * ROW_HEIGHT,
    height: ROW_HEIGHT,
  }));

  const headerBars = Array.from({ length: song.totalBars }).map(
    (_, barIndex) => {
      const left = barIndex * STEPS_PER_BAR * STEP_WIDTH;

      return {
        key: `bar-${barIndex}`,
        barIndex,
        label: String(barIndex + 1),
        left,
        width: STEPS_PER_BAR * STEP_WIDTH,
        borderClass: getBarBorderClass(barIndex),
        isHighlighted: isHighlightedBar(
          barIndex,
          selectedBar,
          selectedBarLength,
        ),
      };
    },
  );

  const gridBars = Array.from({ length: song.totalBars }).map(
    (_, barIndex) => ({
      key: `grid-bar-${barIndex}`,
      barIndex,
      label: String(barIndex + 1),
      left: barIndex * STEPS_PER_BAR * STEP_WIDTH,
      width: STEPS_PER_BAR * STEP_WIDTH,
      borderClass: getBarBorderClass(barIndex),
      isHighlighted: isHighlightedBar(barIndex, selectedBar, selectedBarLength),
    }),
  );

  const notes = song.tracks.flatMap((track) => {
    const isActive = activeTrackIds.includes(track.id);

    return track.notes.map((note) => {
      const topIndex = song.range.maxOctave * 12 + 11 - note.noteNumber;

      return {
        id: note.id,
        title: `${track.name} ${formatNoteName(note.noteNumber)}`,
        top: topIndex * ROW_HEIGHT + 2,
        left: note.startStep * STEP_WIDTH,
        width: Math.max(4, note.durationSteps * STEP_WIDTH - 2),
        height: ROW_HEIGHT - 4,
        borderColor: track.color,
        backgroundColor: isActive ? `${track.color}80` : "transparent",
      };
    });
  });

  return {
    containerWidth: LABEL_WIDTH + gridWidth,
    containerMinHeight: gridHeight + 40,
    gridWidth,
    gridHeight,
    headerHeight: 40,
    labelWidth: LABEL_WIDTH,
    noteLabels,
    gridRows,
    headerBars,
    gridBars,
    notes,
  };
}

export function resolvePianoRollBarSelection(
  params: PianoRollBarSelectionParams,
): PianoRollBarSelectionResult {
  const {
    activeTrackIds,
    barIndex,
    isPlaying,
    previewEnabled,
    selectedBarLength,
    song,
  } = params;

  if (isPlaying) {
    return {
      shouldStopPlayback: true,
      nextSelectedBar: null,
      sliceExport: null,
      playbackEvents: [],
    };
  }

  const sliceExport = buildSliceExport(
    song,
    activeTrackIds,
    barIndex,
    selectedBarLength,
  );

  return {
    shouldStopPlayback: false,
    nextSelectedBar: barIndex,
    sliceExport,
    playbackEvents: previewEnabled
      ? buildPlaybackEvents(song, activeTrackIds, barIndex, selectedBarLength)
      : [],
  };
}
