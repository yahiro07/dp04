import { Scene } from "@fd0/types";

export function createDefaultScene(): Scene {
  return {
    bpm: 120,
    key: "Am",
    units: [
      {
        id: "drum1",
        variant: "seri8-drum",
        position: { x: 0, y: 100 },
        active: true,
        stepNotes: [36, 0, 36, 0, 36, 0, 36, 0],
      },
      {
        id: "bass1",
        variant: "seri8",
        position: { x: 0, y: 0 },
        active: true,
        channel: 1,
        instrumentId: "gm-34",
        relativeNotes: [-1, 0, -1, 0, -1, 0, -1, 0],
      },
      {
        id: "pad1",
        variant: "seri8",
        position: { x: 0, y: 0 },
        active: true,
        channel: 2,
        instrumentId: "gm-89",
        relativeNotes: [0, -2, -2, -2, -2, -2, -2, -2],
      },
    ],
    primaryToneUnit: {
      id: "primary-tone",
      variant: "primary-tone",
      channel: 0,
      instrumentId: "gm-4",
    },
    rootNoteUnit: {
      id: "root-notes",
      variant: "rootNotes-v1",
      active: true,
      relativeRootNotes: [0, -4, -7, -5],
    },
  };
}
