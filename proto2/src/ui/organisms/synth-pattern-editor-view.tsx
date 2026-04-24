import { useState } from "react";
import type { SynthPatternNote } from "@/central/model-types";
import { useCurrentSynthPatternPresenter } from "@/presenter/use-current-synth-pattern-presenter";
import { npx } from "@/ui/styling/styling-utils";

const configs = {
  editorWidth: 320,
  editorHeight: 320,
  stepCount: 16,
  noteRowCount: 25,
};

const centerRowIndex = Math.floor(configs.noteRowCount / 2);
const cellWidth = configs.editorWidth / configs.stepCount;
const cellHeight = configs.editorHeight / configs.noteRowCount;

type DraftNote = {
  pointerId: number;
  startStep: number;
  relativeNoteNumber: number;
  stepDuration: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getStepIndexFromClientX = (clientX: number, left: number) => {
  const localX = clamp(clientX - left, 0, configs.editorWidth - 1);
  return clamp(Math.floor(localX / cellWidth), 0, configs.stepCount - 1);
};

const getRelativeNoteNumberFromClientY = (clientY: number, top: number) => {
  const localY = clamp(clientY - top, 0, configs.editorHeight - 1);
  const rowIndex = clamp(
    Math.floor(localY / cellHeight),
    0,
    configs.noteRowCount - 1,
  );
  return centerRowIndex - rowIndex;
};

const getNoteRect = (note: SynthPatternNote) => {
  const noteY = configs.editorHeight / 2 - note.relativeNoteNumber * cellHeight;
  return {
    x: note.stepPosition * cellWidth,
    y: noteY - cellHeight / 2,
    width: note.stepDuration * cellWidth,
    height: cellHeight,
  };
};

const sortNotes = (notes: SynthPatternNote[]) =>
  [...notes].sort((a, b) => {
    if (a.stepPosition !== b.stepPosition) {
      return a.stepPosition - b.stepPosition;
    }
    if (a.relativeNoteNumber !== b.relativeNoteNumber) {
      return b.relativeNoteNumber - a.relativeNoteNumber;
    }
    return a.stepDuration - b.stepDuration;
  });

const notesOverlap = (a: SynthPatternNote, b: SynthPatternNote) =>
  a.stepPosition < b.stepPosition + b.stepDuration &&
  b.stepPosition < a.stepPosition + a.stepDuration;

const GridBackground = ({
  nx,
  ny,
  width,
  height,
  bgAlterStrideX,
}: {
  nx: number;
  ny: number;
  width: number;
  height: number;
  bgAlterStrideX?: number;
}) => {
  const cellW = width / nx;
  const cellH = height / ny;

  const bgAlterStride = bgAlterStrideX ?? 0;

  return (
    <div
      css={{
        position: "absolute",
        left: npx(0),
        top: npx(0),
        width: npx(width),
        height: npx(height),
      }}
    >
      {Array.from({ length: nx * ny }).map((_, i) => {
        const xi = i % nx;
        const yi = Math.floor(i / nx);
        const x = xi * cellW;
        const y = yi * cellH;
        const bgAlter = xi % (bgAlterStride * 2) < bgAlterStride;
        return (
          <div
            key={`${xi}-${yi}`}
            css={{
              position: "absolute",
              left: npx(x),
              top: npx(y),
              width: npx(cellW),
              height: npx(cellH),
              border: "solid 1px #ddd",
              backgroundColor: bgAlter ? "#fff" : "#f0f0f0",
            }}
          />
        );
      })}
    </div>
  );
};

export const SynthPatternEditorView = () => {
  const presenter = useCurrentSynthPatternPresenter();
  const [draftNote, setDraftNote] = useState<DraftNote | null>(null);

  const commitNote = (note: SynthPatternNote) => {
    const nextNotes = presenter.notes.filter((existingNote) => {
      return !(
        existingNote.relativeNoteNumber === note.relativeNoteNumber &&
        notesOverlap(existingNote, note)
      );
    });
    presenter.replaceNotes(sortNotes([...nextNotes, note]));
  };

  const deleteNote = (noteToDelete: SynthPatternNote) => {
    presenter.replaceNotes(
      presenter.notes.filter((note) => {
        return !(
          note.relativeNoteNumber === noteToDelete.relativeNoteNumber &&
          note.stepPosition === noteToDelete.stepPosition &&
          note.stepDuration === noteToDelete.stepDuration
        );
      }),
    );
  };

  const updateDraftDuration = (
    pointerId: number,
    clientX: number,
    rect: DOMRect,
  ) => {
    setDraftNote((currentDraft) => {
      if (!currentDraft || currentDraft.pointerId !== pointerId) {
        return currentDraft;
      }
      const currentStep = getStepIndexFromClientX(clientX, rect.left);
      return {
        ...currentDraft,
        stepDuration: clamp(
          currentStep - currentDraft.startStep + 1,
          1,
          configs.stepCount - currentDraft.startStep,
        ),
      };
    });
  };

  return (
    <div
      css={{
        width: npx(configs.editorWidth),
        height: npx(configs.editorHeight),
        position: "relative",
        touchAction: "none",
        userSelect: "none",
      }}
      onPointerDown={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const startStep = getStepIndexFromClientX(event.clientX, rect.left);
        const relativeNoteNumber = getRelativeNoteNumberFromClientY(
          event.clientY,
          rect.top,
        );
        setDraftNote({
          pointerId: event.pointerId,
          startStep,
          relativeNoteNumber,
          stepDuration: 1,
        });
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        updateDraftDuration(event.pointerId, event.clientX, rect);
      }}
      onPointerUp={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        updateDraftDuration(event.pointerId, event.clientX, rect);
        setDraftNote((currentDraft) => {
          if (!currentDraft || currentDraft.pointerId !== event.pointerId) {
            return currentDraft;
          }
          commitNote({
            relativeNoteNumber: currentDraft.relativeNoteNumber,
            stepPosition: currentDraft.startStep,
            stepDuration: currentDraft.stepDuration,
          });
          return null;
        });
      }}
      onPointerCancel={(event) => {
        setDraftNote((currentDraft) =>
          currentDraft?.pointerId === event.pointerId ? null : currentDraft,
        );
      }}
    >
      <GridBackground
        width={configs.editorWidth}
        height={configs.editorHeight}
        nx={configs.stepCount}
        ny={configs.noteRowCount}
        bgAlterStrideX={4}
      />
      {presenter.notes.map((note) => {
        const noteRect = getNoteRect(note);
        return (
          <div
            key={`${note.stepPosition}-${note.stepDuration}-${note.relativeNoteNumber}`}
            css={{
              position: "absolute",
              left: npx(noteRect.x),
              top: npx(noteRect.y),
              width: npx(noteRect.width),
              height: npx(noteRect.height),
              backgroundColor: "#4682b4",
              cursor: "pointer",
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            onClick={() => {
              deleteNote(note);
            }}
          />
        );
      })}
      {draftNote ? (
        <div
          css={{
            position: "absolute",
            left: npx(draftNote.startStep * cellWidth),
            top: npx(
              configs.editorHeight / 2 -
                draftNote.relativeNoteNumber * cellHeight -
                cellHeight / 2,
            ),
            width: npx(draftNote.stepDuration * cellWidth),
            height: npx(cellHeight),
            backgroundColor: "rgb(70 130 180 / 0.45)",
            border: "1px solid #4682b4",
            pointerEvents: "none",
          }}
        />
      ) : null}
    </div>
  );
};
