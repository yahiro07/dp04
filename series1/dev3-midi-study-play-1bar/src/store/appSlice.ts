import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { parseMidiFileBytes } from "@/lib/midiParser";
import type { BarLength, ParsedMidiSong } from "@/types/midi";

interface AppState {
  song: ParsedMidiSong | null;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  previewEnabled: boolean;
  selectedBarLength: BarLength;
  selectedBar: number | null;
  activeChannels: number[];
  isPlaying: boolean;
}

function collectSongChannels(song: ParsedMidiSong) {
  return Array.from(
    new Set(song.tracks.flatMap((track) => track.notes.map((note) => note.channel))),
  ).sort((left, right) => left - right);
}

const initialState: AppState = {
  song: null,
  status: "idle",
  error: null,
  previewEnabled: true,
  selectedBarLength: 1,
  selectedBar: null,
  activeChannels: [],
  isPlaying: false,
};

export const loadMidiFile = createAsyncThunk(
  "app/loadMidiFile",
  async (file: File) => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    return parseMidiFileBytes(bytes, file.name);
  },
);

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setPreviewEnabled(state, action: PayloadAction<boolean>) {
      state.previewEnabled = action.payload;
    },
    setSelectedBarLength(state, action: PayloadAction<BarLength>) {
      state.selectedBarLength = action.payload;
    },
    setSelectedBar(state, action: PayloadAction<number | null>) {
      state.selectedBar = action.payload;
    },
    toggleChannel(state, action: PayloadAction<number>) {
      if (!state.song) {
        return;
      }

      if (state.activeChannels.includes(action.payload)) {
        state.activeChannels = state.activeChannels.filter(
          (channel) => channel !== action.payload,
        );
        return;
      }

      state.activeChannels = [...state.activeChannels, action.payload].sort(
        (left, right) => left - right,
      );
    },
    setPlaying(state, action: PayloadAction<boolean>) {
      state.isPlaying = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadMidiFile.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.isPlaying = false;
      })
      .addCase(
        loadMidiFile.fulfilled,
        (state, action: PayloadAction<ParsedMidiSong>) => {
          state.song = action.payload;
          state.status = "ready";
          state.error = null;
          state.selectedBar = null;
          state.activeChannels = collectSongChannels(action.payload);
        },
      )
      .addCase(loadMidiFile.rejected, (state, action) => {
        state.status = "error";
        state.song = null;
        state.activeChannels = [];
        state.error = action.error.message ?? "Failed to parse MIDI file.";
      });
  },
});

export const {
  setPlaying,
  setPreviewEnabled,
  setSelectedBar,
  setSelectedBarLength,
  toggleChannel,
} = appSlice.actions;
export const appReducer = appSlice.reducer;
