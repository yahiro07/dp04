import { getMachineTitle } from "../../music";
import type { MachineId, PlaybackMode } from "../../types";

interface DetailHeaderProps {
  activeMachineId: MachineId;
  currentSceneIndex: number;
  midiAvailable: boolean;
  playbackMode: PlaybackMode;
  queuedSceneIndex: number | null;
}

export function DetailHeader({
  activeMachineId,
  currentSceneIndex,
  midiAvailable,
  playbackMode,
  queuedSceneIndex,
}: DetailHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-800 bg-stone-950/60 px-4 py-3">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Detail</p>
        <h3 className="mt-1 text-xl font-medium text-stone-100">
          {getMachineTitle(activeMachineId)}
        </h3>
      </div>
      <div className="flex flex-wrap gap-3 text-sm text-stone-300">
        <span>Mode: {playbackMode}</span>
        <span>MIDI: {midiAvailable ? "connected" : "not detected"}</span>
        <span>Scene: {currentSceneIndex + 1}</span>
        {queuedSceneIndex !== null ? <span>Queued: {queuedSceneIndex + 1}</span> : null}
      </div>
    </div>
  );
}