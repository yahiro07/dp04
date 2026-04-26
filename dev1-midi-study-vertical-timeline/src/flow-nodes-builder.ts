import { FlowNode, SmfSong } from "@/types";

function getStepPosition(tick: number, timeDivision: number) {
  if ((timeDivision & 0x8000) !== 0) {
    throw new Error("SMPTE time division is not supported for flow nodes");
  }

  const ticksPer16thNote = timeDivision / 4;
  if (ticksPer16thNote <= 0) {
    throw new Error("Invalid MIDI time division");
  }

  return tick / ticksPer16thNote;
}

function getActiveNoteKey(trackIndex: number, noteNumber: number) {
  return `${trackIndex}:${noteNumber}`;
}

export function buildFlowNodes(song: SmfSong): FlowNode[] {
  const activeNotes = new Map<
    string,
    Array<{
      trackIndex: number;
      stepPosition: number;
      noteNumber: number;
      velocity: number;
    }>
  >();
  const flowNodes: FlowNode[] = [];

  for (const command of song.commands) {
    const [status = 0, data1 = 0, data2 = 0] = command.bytes;
    const op = status & 0xf0;
    const stepPosition = getStepPosition(command.tick, song.meta.timeDivision);

    if (op === 0x90 && data2 > 0) {
      const key = getActiveNoteKey(command.trackIndex, data1);
      const pendingNotes = activeNotes.get(key) ?? [];
      pendingNotes.push({
        trackIndex: command.trackIndex,
        stepPosition,
        noteNumber: data1,
        velocity: data2,
      });
      activeNotes.set(key, pendingNotes);
      continue;
    }

    if (op === 0x80 || (op === 0x90 && data2 === 0)) {
      const key = getActiveNoteKey(command.trackIndex, data1);
      const pendingNotes = activeNotes.get(key);
      const activeNote = pendingNotes?.pop();

      if (activeNote) {
        if (pendingNotes && pendingNotes.length > 0) {
          activeNotes.set(key, pendingNotes);
        } else {
          activeNotes.delete(key);
        }

        flowNodes.push({
          type: "note",
          trackIndex: activeNote.trackIndex,
          stepPosition: activeNote.stepPosition,
          channel: status & 0x0f,
          noteNumber: activeNote.noteNumber,
          velocity: activeNote.velocity,
          stepDuration: stepPosition - activeNote.stepPosition,
        });
      }
      continue;
    }

    flowNodes.push({
      type: "command",
      trackIndex: command.trackIndex,
      stepPosition,
      bytes: command.bytes,
    });
  }

  return flowNodes;
}
