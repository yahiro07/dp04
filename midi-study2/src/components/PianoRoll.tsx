import clsx from "clsx";
import { STEPS_PER_BAR } from "@/constants/music";
import { formatNoteName } from "@/lib/formatters";
import type { BarLength, ParsedMidiSong } from "@/types/midi";

const STEP_WIDTH = 22;
const ROW_HEIGHT = 20;
const LABEL_WIDTH = 72;

interface PianoRollProps {
  song: ParsedMidiSong;
  activeTrackIds: string[];
  selectedBar: number | null;
  selectedBarLength: BarLength;
  onBarClick: (barIndex: number) => void;
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

export function PianoRoll(props: PianoRollProps) {
  const { activeTrackIds, onBarClick, selectedBar, selectedBarLength, song } =
    props;
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

  return (
    <div className="min-w-0 flex-1 overflow-auto bg-white">
      <div
        className="relative"
        style={{ width: LABEL_WIDTH + gridWidth, minHeight: gridHeight + 40 }}
      >
        <div className="sticky top-0 z-10 flex bg-stone-50/95 backdrop-blur">
          <div className="w-[72px] shrink-0 border-b border-r border-stone-300 px-2 py-2 text-xs font-medium uppercase tracking-wide text-stone-500">
            Notes
          </div>
          <div
            className="relative border-b border-stone-300"
            style={{ width: gridWidth, height: 40 }}
          >
            {Array.from({ length: song.totalBars }).map((_, barIndex) => {
              const x = barIndex * STEPS_PER_BAR * STEP_WIDTH;
              const highlighted =
                selectedBar !== null &&
                barIndex >= selectedBar &&
                barIndex < selectedBar + selectedBarLength;

              return (
                <button
                  key={`bar-${barIndex}`}
                  className={clsx(
                    "absolute top-0 h-full border-l bg-transparent text-left text-xs text-stone-600",
                    getBarBorderClass(barIndex),
                    highlighted && "bg-amber-200/45",
                  )}
                  style={{ left: x, width: STEPS_PER_BAR * STEP_WIDTH }}
                  onClick={() => onBarClick(barIndex)}
                  type="button"
                >
                  <span className="pointer-events-none absolute left-2 top-2">
                    {barIndex + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex">
          <div className="sticky left-0 z-10 w-[72px] shrink-0 border-r border-stone-300 bg-stone-50">
            {midiRows.map((midi) => {
              const isOctaveBoundary = midi % 12 === 11;

              return (
                <div
                  key={`label-${midi}`}
                  className={clsx(
                    "flex items-center justify-end border-t px-2 text-xs text-stone-500",
                    isOctaveBoundary ? "border-stone-500" : "border-stone-200",
                  )}
                  style={{ height: ROW_HEIGHT }}
                >
                  {formatNoteName(midi)}
                </div>
              );
            })}
          </div>

          <div
            className="relative"
            style={{ width: gridWidth, height: gridHeight }}
          >
            {midiRows.map((midi, rowIndex) => {
              const top = rowIndex * ROW_HEIGHT;
              const isOctaveBoundary = midi % 12 === 11;

              return (
                <div
                  key={`row-${midi}`}
                  className={clsx(
                    "absolute left-0 w-full border-t",
                    isOctaveBoundary ? "border-stone-500" : "border-stone-200",
                  )}
                  style={{ top, height: ROW_HEIGHT }}
                />
              );
            })}

            {Array.from({ length: song.totalBars }).map((_, barIndex) => {
              const left = barIndex * STEPS_PER_BAR * STEP_WIDTH;
              const highlighted =
                selectedBar !== null &&
                barIndex >= selectedBar &&
                barIndex < selectedBar + selectedBarLength;

              return (
                <div
                  key={`grid-bar-${barIndex}`}
                  className={clsx(
                    "absolute top-0 h-full border-l",
                    getBarBorderClass(barIndex),
                    highlighted && "bg-amber-100/50",
                  )}
                  style={{ left, width: STEPS_PER_BAR * STEP_WIDTH }}
                />
              );
            })}

            {song.tracks.map((track) => {
              const active = activeTrackIds.includes(track.id);

              return track.notes.map((note) => {
                const topIndex = song.range.maxOctave * 12 + 11 - note.midi;
                const top = topIndex * ROW_HEIGHT + 2;
                const left = note.startStep * STEP_WIDTH;
                const width = Math.max(4, note.durationSteps * STEP_WIDTH - 2);

                return (
                  <div
                    key={note.id}
                    className="absolute rounded-sm border"
                    style={{
                      top,
                      left,
                      width,
                      height: ROW_HEIGHT - 4,
                      borderColor: track.color,
                      backgroundColor: active
                        ? `${track.color}80`
                        : "transparent",
                    }}
                    title={`${track.name} ${formatNoteName(note.midi)}`}
                  />
                );
              });
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
