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
  activeTrackIds: string[];
  isPlaying: boolean;
}

const initialState: AppState = {
  song: null,
  status: "idle",
  error: null,
  previewEnabled: true,
  selectedBarLength: 1,
  selectedBar: null,
  activeTrackIds: [],
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
    toggleTrack(state, action: PayloadAction<string>) {
      if (!state.song) {
        return;
      }

      if (state.activeTrackIds.includes(action.payload)) {
        state.activeTrackIds = state.activeTrackIds.filter(
          (trackId) => trackId !== action.payload,
        );
        return;
      }

      state.activeTrackIds = [...state.activeTrackIds, action.payload];
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
          state.activeTrackIds = action.payload.tracks.map((track) => track.id);
        },
      )
      .addCase(loadMidiFile.rejected, (state, action) => {
        state.status = "error";
        state.song = null;
        state.activeTrackIds = [];
        state.error = action.error.message ?? "Failed to parse MIDI file.";
      });
  },
});

export const {
  setPlaying,
  setPreviewEnabled,
  setSelectedBar,
  setSelectedBarLength,
  toggleTrack,
} = appSlice.actions;
export const appReducer = appSlice.reducer;
