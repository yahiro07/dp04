import { useEffect, useRef } from "react";
import { useMidiKeyboardPresenter } from "@/presenter/use-midi-keyboard-presenter";

const configs = {
  minNote: 48,
  noteCount: 32,
  keyboardWidth: 600,
  keyboardHeight: 100,
  statusWidth: 84,
  keyAreaGap: 8,
  whiteKeyHeight: 84,
  blackKeyHeight: 50,
  pointerVelocity: 100,
};

const keyAreaWidth =
  configs.keyboardWidth - configs.statusWidth - configs.keyAreaGap;

function useKeyboardPointerInput(
  triggerUiMidiNote: (noteNumber: number, velocity: number) => void,
) {
  const activePointerRef = useRef<{ pointerId: number; note: number } | null>(
    null,
  );

  const releaseActivePointerNote = () => {
    const activePointer = activePointerRef.current;
    if (!activePointer) {
      return;
    }
    triggerUiMidiNote(activePointer.note, 0);
    activePointerRef.current = null;
  };

  const playPointerNote = (pointerId: number, note: number) => {
    const activePointer = activePointerRef.current;
    if (activePointer?.pointerId === pointerId && activePointer.note === note) {
      return;
    }
    if (activePointer?.pointerId === pointerId) {
      triggerUiMidiNote(activePointer.note, 0);
    }
    triggerUiMidiNote(note, configs.pointerVelocity);
    activePointerRef.current = { pointerId, note };
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: synchronous to lifecycle
  useEffect(() => {
    const handlePointerEnd = (event: PointerEvent) => {
      if (activePointerRef.current?.pointerId !== event.pointerId) {
        return;
      }
      releaseActivePointerNote();
    };

    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);
    return () => {
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
    };
  }, [triggerUiMidiNote]);

  return {
    playPointerNote,
    releaseActivePointerNote,
  };
}

export const MidiKeyboardView = () => {
  const { connected, holdingNotes, triggerUiMidiNote } =
    useMidiKeyboardPresenter();
  const holdingNoteSet = new Set(holdingNotes);

  const { playPointerNote, releaseActivePointerNote } =
    useKeyboardPointerInput(triggerUiMidiNote);

  return (
    <KeyboardShell>
      <StatusIndicator connected={connected} holdingNotes={holdingNotes} />
      <KeyboardFrame
        holdingNotes={holdingNoteSet}
        onNotePointerDown={playPointerNote}
        onKeyboardPointerLeave={releaseActivePointerNote}
        onNotePointerEnter={playPointerNote}
      />
    </KeyboardShell>
  );
};

const KeyboardShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      css={{
        width: `${configs.keyboardWidth}px`,
        height: `${configs.keyboardHeight}px`,
        display: "flex",
        alignItems: "stretch",
        gap: "8px",
        padding: "6px",
        boxSizing: "border-box",
        border: "1px solid #51606b",
        borderRadius: "12px",
        background:
          "linear-gradient(180deg, rgb(249 252 255) 0%, rgb(224 231 238) 100%)",
        boxShadow: "0 3px 12px rgb(15 23 42 / 0.12)",
      }}
    >
      {children}
    </div>
  );
};

const StatusIndicator = ({
  connected,
  holdingNotes,
}: {
  connected: boolean;
  holdingNotes: number[];
}) => {
  const latestNote = holdingNotes[holdingNotes.length - 1];
  return (
    <div
      css={{
        width: `${configs.statusWidth}px`,
        flexShrink: 0,
        borderRadius: "8px",
        background: "rgb(21 28 36)",
        color: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "10px 9px 8px",
        boxSizing: "border-box",
      }}
    >
      <div
        css={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          css={{
            width: "10px",
            height: "10px",
            borderRadius: "999px",
            background: connected ? "#34d399" : "#f87171",
            boxShadow: connected
              ? "0 0 10px rgb(52 211 153 / 0.7)"
              : "0 0 8px rgb(248 113 113 / 0.45)",
          }}
        />
        <span
          css={{
            fontSize: "11px",
            lineHeight: 1.1,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {connected ? "On" : "Off"}
        </span>
      </div>
      <div
        css={{
          display: "grid",
          gap: "2px",
        }}
      >
        <span
          css={{
            fontSize: "9px",
            opacity: 0.72,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          MIDI In
        </span>
        <span
          css={{
            fontSize: "18px",
            lineHeight: 1,
            fontWeight: 700,
          }}
        >
          {latestNote ?? <>&#160;</>}
        </span>
        <span
          css={{
            fontSize: "9px",
            opacity: 0.72,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Note held
        </span>
      </div>
    </div>
  );
};

const KeyboardFrame = ({
  holdingNotes,
  onNotePointerDown,
  onKeyboardPointerLeave,
  onNotePointerEnter,
}: {
  holdingNotes: Set<number>;
  onNotePointerDown(pointerId: number, note: number): void;
  onKeyboardPointerLeave(): void;
  onNotePointerEnter(pointerId: number, note: number): void;
}) => {
  const whiteKeys = getWhiteKeys();
  const blackKeys = getBlackKeys(whiteKeys);

  return (
    <div
      css={{
        position: "relative",
        width: `${keyAreaWidth}px`,
        height: `${configs.whiteKeyHeight}px`,
        alignSelf: "center",
        borderRadius: "10px",
        overflow: "hidden",
        background: "#c8d2dc",
        boxShadow: "inset 0 1px 2px rgb(15 23 42 / 0.18)",
        touchAction: "none",
      }}
      onPointerLeave={onKeyboardPointerLeave}
    >
      <WhiteKeyLayer
        whiteKeys={whiteKeys}
        holdingNotes={holdingNotes}
        onNotePointerDown={onNotePointerDown}
        onNotePointerEnter={onNotePointerEnter}
      />
      <BlackKeyLayer
        blackKeys={blackKeys}
        holdingNotes={holdingNotes}
        onNotePointerDown={onNotePointerDown}
        onNotePointerEnter={onNotePointerEnter}
      />
    </div>
  );
};

const WhiteKeyLayer = ({
  whiteKeys,
  holdingNotes,
  onNotePointerDown,
  onNotePointerEnter,
}: {
  whiteKeys: WhiteKeyData[];
  holdingNotes: Set<number>;
  onNotePointerDown(pointerId: number, note: number): void;
  onNotePointerEnter(pointerId: number, note: number): void;
}) => {
  const whiteKeyWidth = keyAreaWidth / whiteKeys.length;

  return (
    <>
      {whiteKeys.map((key, index) => (
        <WhiteKey
          key={key.note}
          note={key.note}
          left={index * whiteKeyWidth}
          width={whiteKeyWidth}
          active={holdingNotes.has(key.note)}
          onNotePointerDown={onNotePointerDown}
          onNotePointerEnter={onNotePointerEnter}
        />
      ))}
    </>
  );
};

const BlackKeyLayer = ({
  blackKeys,
  holdingNotes,
  onNotePointerDown,
  onNotePointerEnter,
}: {
  blackKeys: BlackKeyData[];
  holdingNotes: Set<number>;
  onNotePointerDown(pointerId: number, note: number): void;
  onNotePointerEnter(pointerId: number, note: number): void;
}) => {
  return (
    <>
      {blackKeys.map((key) => (
        <BlackKey
          key={key.note}
          note={key.note}
          left={key.left}
          width={key.width}
          active={holdingNotes.has(key.note)}
          onNotePointerDown={onNotePointerDown}
          onNotePointerEnter={onNotePointerEnter}
        />
      ))}
    </>
  );
};

const WhiteKey = ({
  note,
  left,
  width,
  active,
  onNotePointerDown,
  onNotePointerEnter,
}: {
  note: number;
  left: number;
  width: number;
  active: boolean;
  onNotePointerDown(pointerId: number, note: number): void;
  onNotePointerEnter(pointerId: number, note: number): void;
}) => {
  return (
    <div
      css={{
        position: "absolute",
        left: `${left}px`,
        top: 0,
        width: `${width}px`,
        height: "100%",
        borderRight: "1px solid rgb(111 128 144 / 0.35)",
        borderBottomLeftRadius: "6px",
        borderBottomRightRadius: "6px",
        background: active
          ? "linear-gradient(180deg, #d7f7ec 0%, #7dd3a7 100%)"
          : "linear-gradient(180deg, #ffffff 0%, #edf2f7 100%)",
        boxShadow: active
          ? "inset 0 -8px 12px rgb(22 163 74 / 0.18)"
          : "inset 0 -10px 14px rgb(148 163 184 / 0.22)",
        cursor: "pointer",
      }}
      onPointerDown={(event) => {
        event.preventDefault();
        onNotePointerDown(event.pointerId, note);
      }}
      onPointerEnter={(event) => {
        if ((event.buttons & 1) === 0) {
          return;
        }
        onNotePointerEnter(event.pointerId, note);
      }}
      title={`Note ${note}`}
    />
  );
};

const BlackKey = ({
  note,
  left,
  width,
  active,
  onNotePointerDown,
  onNotePointerEnter,
}: {
  note: number;
  left: number;
  width: number;
  active: boolean;
  onNotePointerDown(pointerId: number, note: number): void;
  onNotePointerEnter(pointerId: number, note: number): void;
}) => {
  return (
    <div
      css={{
        position: "absolute",
        left: `${left}px`,
        top: 0,
        width: `${width}px`,
        height: `${configs.blackKeyHeight}px`,
        borderRadius: "0 0 6px 6px",
        background: active
          ? "linear-gradient(180deg, #1f7a57 0%, #0f3f2d 100%)"
          : "linear-gradient(180deg, #374151 0%, #111827 100%)",
        boxShadow: active
          ? "0 2px 8px rgb(16 185 129 / 0.35)"
          : "0 2px 6px rgb(15 23 42 / 0.28)",
        cursor: "pointer",
      }}
      onPointerDown={(event) => {
        event.preventDefault();
        onNotePointerDown(event.pointerId, note);
      }}
      onPointerEnter={(event) => {
        if ((event.buttons & 1) === 0) {
          return;
        }
        onNotePointerEnter(event.pointerId, note);
      }}
      title={`Note ${note}`}
    />
  );
};

type WhiteKeyData = {
  note: number;
};

type BlackKeyData = {
  note: number;
  left: number;
  width: number;
};

function getWhiteKeys(): WhiteKeyData[] {
  const keys: WhiteKeyData[] = [];

  for (
    let note = configs.minNote;
    note < configs.minNote + configs.noteCount;
    note += 1
  ) {
    if (!isBlackKey(note)) {
      keys.push({ note });
    }
  }

  return keys;
}

function getBlackKeys(whiteKeys: WhiteKeyData[]): BlackKeyData[] {
  const whiteIndexByNote = new Map(
    whiteKeys.map((key, index) => [key.note, index]),
  );
  const whiteKeyWidth = keyAreaWidth / whiteKeys.length;
  const blackKeyWidth = whiteKeyWidth * 0.62;
  const keys: BlackKeyData[] = [];

  for (
    let note = configs.minNote;
    note < configs.minNote + configs.noteCount;
    note += 1
  ) {
    if (!isBlackKey(note)) {
      continue;
    }

    const previousWhiteIndex = whiteIndexByNote.get(note - 1);
    if (previousWhiteIndex === undefined) {
      continue;
    }

    keys.push({
      note,
      width: blackKeyWidth,
      left: (previousWhiteIndex + 1) * whiteKeyWidth - blackKeyWidth / 2,
    });
  }

  return keys;
}

function isBlackKey(note: number): boolean {
  return [1, 3, 6, 8, 10].includes(note % 12);
}
