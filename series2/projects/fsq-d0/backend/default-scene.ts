import { Scene, SpecialNote } from "@fd0/types";

export function createDefaultScene(): Scene {
  const { rest: r, tie } = SpecialNote;
  return {
    bpm: 120,
    key: "Am",
    units: [
      {
        id: "drum1",
        variant: "seri8-drum",
        position: { x: 0, y: 100 },
        active: true,
        stepNotes: [36, r, 36, r, 36, r, 36, r],
      },
      {
        id: "bass1",
        variant: "seri8",
        position: { x: 0, y: 0 },
        active: true,
        channel: 1,
        instrumentId: "gm-34",
        relativeNotes: [r, 0, r, 0, r, 0, r, 0],
      },
      {
        id: "pad1",
        variant: "seri8",
        position: { x: -200, y: 0 },
        active: true,
        channel: 2,
        instrumentId: "gm-89",
        relativeNotes: [0, tie, tie, tie, tie, tie, tie, tie],
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
