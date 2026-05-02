import type {
  MachineId,
  MelodyNote,
  PartMachineId,
  PlaybackSnapshot,
  SceneMachineId,
  SongKey,
  SongState,
  VariationIndex,
} from "./types";

export const DRUM_LANES = ["Kick", "Snare", "Open Hat", "Closed Hat"] as const;
export const PART_LANES = ["1", "3", "5", "8"] as const;
export const BASE_BARS_OPTIONS = [1, 2, 4, 8, 16] as const;
export const LOOP_COUNT_OPTIONS = [1, 2, 4] as const;
export const VARIATIONS = [0, 1, 2, 3] as const;
export const MELODY_ROW_COUNT = 36;
export const MELODY_BASE_NOTE = 48;

const MAJOR_QUALITY_MAP: Record<number, "major" | "minor"> = {
  0: "major",
  2: "minor",
  4: "minor",
  5: "major",
  7: "major",
  9: "minor",
};

const MINOR_QUALITY_MAP: Record<number, "major" | "minor"> = {
  0: "minor",
  3: "major",
  5: "minor",
  7: "minor",
  8: "major",
  10: "major",
};

const MACHINE_TITLES: Record<MachineId, string> = {
  core: "音源コア",
  drums: "ドラム",
  partA: "パート ch2",
  partB: "パート ch3",
  partC: "パート ch4",
  root: "ルート",
  melody: "メロディー ch5",
};

const SCENE_MACHINE_IDS: SceneMachineId[] = [
  "drums",
  "partA",
  "partB",
  "partC",
  "root",
  "melody",
];

export function createDefaultSong(): SongState {
  return {
    bpm: 112,
    key: "Am",
    autoAdvanceScenes: false,
    currentSceneIndex: 0,
    activeMachineId: "drums",
    core: {
      programs: {
        partA: 80,
        partB: 88,
        partC: 38,
        melody: 81,
      },
    },
    drums: {
      patterns: [0, 1, 2, 3].map((variation) =>
        createDefaultDrumPattern(variation as VariationIndex),
      ),
    },
    parts: {
      partA: createDefaultPartMachine(0),
      partB: createDefaultPartMachine(-1),
      partC: createDefaultPartMachine(1),
    },
    root: {
      patterns: [
        [0, 0, 0, 0],
        [0, 5, 3, 7],
        [0, 0, -2, 5],
        [0, 7, 5, 3],
      ],
    },
    melody: {
      octaveShift: 0,
      patterns: [0, 1, 2, 3].map((variation) =>
        createDefaultMelodyPattern(variation as VariationIndex),
      ),
    },
    scenes: [0, 1, 2, 3].map((sceneIndex) => createDefaultScene(sceneIndex)),
  };
}

function createDefaultScene(sceneIndex: number) {
  return {
    baseBars: (sceneIndex === 0 ? 4 : 2) as 1 | 2 | 4 | 8 | 16,
    loopCount: 1 as const,
    machines: {
      drums: { enabled: true, variation: (sceneIndex % 4) as VariationIndex },
      partA: { enabled: true, variation: 0 as VariationIndex },
      partB: { enabled: sceneIndex > 0, variation: 1 as VariationIndex },
      partC: { enabled: sceneIndex > 1, variation: 2 as VariationIndex },
      root: { enabled: true, variation: (sceneIndex % 4) as VariationIndex },
      melody: { enabled: true, variation: (sceneIndex % 4) as VariationIndex },
    },
  };
}

function createDefaultDrumPattern(variation: VariationIndex) {
  const pattern = Array.from({ length: 4 }, () =>
    Array.from({ length: 16 }, () => false),
  );
  const kick = [0, 4, 8, 12];
  const snare = [4, 12];
  const closedHat = Array.from({ length: 16 }, (_, stepIndex) => stepIndex);
  const openHat = variation % 2 === 0 ? [7, 15] : [3, 11];

  for (const stepIndex of kick) {
    pattern[0][stepIndex] = true;
  }
  for (const stepIndex of snare) {
    pattern[1][stepIndex] = true;
  }
  for (const stepIndex of closedHat) {
    pattern[3][stepIndex] = stepIndex % 2 === 0;
  }
  for (const stepIndex of openHat) {
    pattern[2][stepIndex] = true;
  }

  return pattern;
}

function createDefaultPartMachine(octaveShift: number) {
  return {
    octaveShift,
    patterns: [
      createPartPattern([0, 4, 8, 12], [4, 12], [], []),
      createPartPattern([0, 8], [2, 10], [4, 12], []),
      createPartPattern([0, 6, 8, 14], [0, 8], [], [8]),
      createPartPattern([0, 2, 4, 6, 8, 10, 12, 14], [], [4, 12], []),
    ],
  };
}

function createPartPattern(
  rootSteps: number[],
  thirdSteps: number[],
  fifthSteps: number[],
  octaveSteps: number[],
) {
  const pattern = Array.from({ length: 4 }, () =>
    Array.from({ length: 16 }, () => false),
  );
  for (const stepIndex of rootSteps) {
    pattern[0][stepIndex] = true;
  }
  for (const stepIndex of thirdSteps) {
    pattern[1][stepIndex] = true;
  }
  for (const stepIndex of fifthSteps) {
    pattern[2][stepIndex] = true;
  }
  for (const stepIndex of octaveSteps) {
    pattern[3][stepIndex] = true;
  }
  return pattern;
}

function createDefaultMelodyPattern(variation: VariationIndex): MelodyNote[] {
  if (variation === 0) {
    return [
      { midi: 69, step: 0, durationSteps: 2 },
      { midi: 72, step: 4, durationSteps: 2 },
      { midi: 76, step: 8, durationSteps: 2 },
      { midi: 72, step: 12, durationSteps: 2 },
      { midi: 69, step: 16, durationSteps: 2 },
      { midi: 72, step: 24, durationSteps: 2 },
    ];
  }

  return [];
}

export function getMachineTitle(machineId: MachineId) {
  return MACHINE_TITLES[machineId];
}

export function getSceneMachineIds() {
  return SCENE_MACHINE_IDS;
}

export function getSceneMachineTitle(machineId: SceneMachineId) {
  return MACHINE_TITLES[machineId];
}

export function getKeyRootMidi(songKey: SongKey) {
  return songKey === "C" ? 48 : 45;
}

export function clampBpm(bpm: number) {
  return Math.max(60, Math.min(180, bpm));
}

export function clampOctaveShift(octaveShift: number) {
  return Math.max(-2, Math.min(2, octaveShift));
}

export function getChordQuality(songKey: SongKey, rootOffset: number) {
  const normalizedOffset = mod(rootOffset, 12);
  const qualityMap = songKey === "C" ? MAJOR_QUALITY_MAP : MINOR_QUALITY_MAP;
  return qualityMap[normalizedOffset] ?? "minor";
}

export function getPartLaneInterval(
  songKey: SongKey,
  rootOffset: number,
  laneIndex: number,
) {
  if (laneIndex === 0) {
    return 0;
  }
  if (laneIndex === 1) {
    return getChordQuality(songKey, rootOffset) === "major" ? 4 : 3;
  }
  if (laneIndex === 2) {
    return 7;
  }
  return 12;
}

export function getCurrentRootInfo(
  song: Pick<PlaybackSnapshot, "key" | "currentSceneIndex" | "scenes" | "root">,
  isManual: boolean,
  manualRootNote: number | null,
  barIndex: number,
) {
  if (isManual && manualRootNote !== null) {
    return {
      rootMidi: manualRootNote,
      rootOffset: mod(manualRootNote - getKeyRootMidi(song.key), 12),
    };
  }

  const scene = song.scenes[song.currentSceneIndex];
  const rootSceneState = scene.machines.root;
  if (!rootSceneState.enabled) {
    return null;
  }

  const rootOffset =
    song.root.patterns[rootSceneState.variation][barIndex % 4] ?? 0;
  return {
    rootMidi: getKeyRootMidi(song.key) + rootOffset,
    rootOffset,
  };
}

export function getDrumMidi(laneIndex: number) {
  return [36, 38, 46, 42][laneIndex] ?? 36;
}

export function getPartChannel(machineId: PartMachineId) {
  return { partA: 0, partB: 1, partC: 2 }[machineId];
}

export function getMelodyChannel() {
  return 3;
}

export function getVariationLabel(variation: number) {
  return `${variation + 1}`;
}

export function getPartMachineIds(): PartMachineId[] {
  return ["partA", "partB", "partC"];
}

export function getMelodyNotesAtStep(pattern: MelodyNote[], step: number) {
  return pattern.filter((note) => note.step === step);
}

export function toggleMelodyCell(
  notes: MelodyNote[],
  step: number,
  midi: number,
) {
  const existingIndex = notes.findIndex(
    (note) => note.step === step && note.midi === midi,
  );
  if (existingIndex >= 0) {
    return notes.filter((_, noteIndex) => noteIndex !== existingIndex);
  }

  const sanitizedStep = Math.max(0, Math.min(63, step));
  const durationSteps = sanitizedStep === 63 ? 1 : 2;
  return [...notes, { midi, step: sanitizedStep, durationSteps }].sort(
    (left, right) => left.step - right.step || left.midi - right.midi,
  );
}

export function getMelodyNoteLabel(midi: number) {
  const names = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const octave = Math.floor(midi / 12) - 1;
  return `${names[mod(midi, 12)]}${octave}`;
}

function mod(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}
