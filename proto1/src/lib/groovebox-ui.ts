import type { ProgramTarget } from "./../types";

export const CORE_PROGRAM_TARGETS: { key: ProgramTarget; label: string }[] = [
  { key: "partA", label: "ch2 Program" },
  { key: "partB", label: "ch3 Program" },
  { key: "partC", label: "ch4 Program" },
  { key: "melody", label: "ch5 Program" },
];

export function primaryButtonClass(isPlaying: boolean) {
  return `rounded-2xl px-5 py-3 text-sm font-medium transition ${
    isPlaying ? "bg-red-500 text-red-950" : "bg-amber-500 text-amber-950"
  }`;
}

export function sceneButtonClass(isActive: boolean, isQueued: boolean) {
  return `flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-medium transition ${
    isActive
      ? "border-amber-500 bg-amber-500 text-amber-950"
      : isQueued
        ? "border-amber-700 bg-amber-950/70 text-amber-200"
        : "border-stone-700 bg-stone-950/70 text-stone-300 hover:border-stone-500"
  }`;
}

export function cardClass(active: boolean) {
  return `flex min-h-[150px] flex-col justify-between rounded-2xl border p-4 text-left transition ${
    active
      ? "border-amber-500 bg-amber-950/30 shadow-lg shadow-amber-950/20"
      : "border-stone-800 bg-stone-950/60 hover:border-stone-700"
  }`;
}

export function toggleButtonClass(enabled: boolean) {
  return `rounded-xl px-3 py-1 text-xs font-medium ${
    enabled
      ? "bg-emerald-500/90 text-emerald-950"
      : "bg-stone-800 text-stone-300"
  }`;
}

export function chipButtonClass(active: boolean) {
  return `rounded-lg px-2 py-1 text-xs ${
    active ? "bg-amber-500 text-amber-950" : "bg-stone-800 text-stone-300"
  }`;
}

export function stepCellClass(active: boolean, stepIndex: number) {
  return `aspect-square rounded-[10px] border transition ${
    active ? "border-amber-400 bg-amber-500" : "border-stone-800 bg-stone-900"
  } ${stepIndex % 4 === 0 ? "ring-1 ring-stone-700/70" : ""}`;
}

export function pianoRollCellClass(active: boolean, stepIndex: number) {
  return `h-8 border transition ${
    active ? "border-sky-300 bg-sky-400" : "border-stone-900 bg-stone-950"
  } ${stepIndex % 4 === 0 ? "bg-stone-900" : ""}`;
}
