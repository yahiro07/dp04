import { formatOctaveRange } from "@/lib/formatters";
import type { BarLength, ParsedMidiSong, TrackData } from "@/types/midi";

export interface TopBarViewModel {
  isLoading: boolean;
  previewEnabled: boolean;
  selectedBarLength: BarLength;
  bpmText: string;
  rangeText: string;
  fileNameText: string;
}

export interface TrackListItemViewModel {
  channel: number;
  id: string;
  name: string;
  color: string;
  isActive: boolean;
}

interface TopBarViewModelParams {
  song: ParsedMidiSong | null;
  isLoading: boolean;
  previewEnabled: boolean;
  selectedBarLength: BarLength;
}

export function createDropMessage(song: ParsedMidiSong | null) {
  if (!song) {
    return "Load a MIDI file to render the piano roll.";
  }

  return `${song.tracks.length} tracks, BPM ${song.bpm}, range ${formatOctaveRange(song.range)}`;
}

export function createTopBarViewModel(
  params: TopBarViewModelParams,
): TopBarViewModel {
  const { isLoading, previewEnabled, selectedBarLength, song } = params;

  return {
    isLoading,
    previewEnabled,
    selectedBarLength,
    bpmText: song ? String(song.bpm) : "-",
    rangeText: song ? formatOctaveRange(song.range) : "-",
    fileNameText: song
      ? song.fileName
      : "Drop a MIDI file anywhere or use Load.",
  };
}

export function createTrackListItems(
  tracks: TrackData[],
  activeChannels: number[],
): TrackListItemViewModel[] {
  const channelMap = new Map<number, TrackListItemViewModel>();

  for (const track of tracks) {
    const channels = Array.from(
      new Set(track.notes.map((note) => note.channel)),
    ).sort((left, right) => left - right);

    for (const channel of channels) {
      if (channelMap.has(channel)) {
        continue;
      }

      channelMap.set(channel, {
        channel,
        id: `channel-${channel}`,
        name: `Channel ${channel + 1}`,
        color: track.color,
        isActive: activeChannels.includes(channel),
      });
    }
  }

  return [...channelMap.values()];
}
