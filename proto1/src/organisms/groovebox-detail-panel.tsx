import { useGroovebox } from "../context/groovebox-context";
import { getPartMachineIds } from "../music";
import type { PartMachineId } from "../types";
import { CoreDetail } from "./detail-panel/core-detail";
import { DetailHeader } from "./detail-panel/detail-header";
import { DrumDetail } from "./detail-panel/drum-detail";
import { MelodyDetail } from "./detail-panel/melody-detail";
import { PartDetail } from "./detail-panel/part-detail";
import { RootDetail } from "./detail-panel/root-detail";
import { SceneSettingsPanel } from "./detail-panel/scene-settings-panel";
import { SceneSummaryPanel } from "./detail-panel/scene-summary-panel";

export function GrooveboxDetailPanel() {
  const {
    currentScene,
    playback,
    setMelodyOctaveShift,
    setPartOctaveShift,
    setProgramAssignment,
    setRootNoteStep,
    setSceneBaseBars,
    setSceneLoopCount,
    song,
    toggleDrumStep,
    toggleMelodyNote,
    togglePartStep,
  } = useGroovebox();

  const activeMachineId = song.activeMachineId;
  const isPartMachine = getPartMachineIds().includes(
    activeMachineId as PartMachineId,
  );

  return (
    <section className="overflow-auto p-4">
      <div className="flex h-full flex-col gap-4">
        <DetailHeader
          activeMachineId={activeMachineId}
          currentSceneIndex={song.currentSceneIndex}
          midiAvailable={playback.midiAvailable}
          playbackMode={playback.playbackMode}
          queuedSceneIndex={playback.queuedSceneIndex}
        />

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_280px]">
          <div className="min-h-0 overflow-auto rounded-2xl border border-stone-800 bg-stone-950/60 p-4">
            {activeMachineId === "core" ? (
              <CoreDetail
                onProgramChange={setProgramAssignment}
                programs={song.core.programs}
              />
            ) : null}

            {activeMachineId === "drums" ? (
              <DrumDetail
                onToggleDrum={toggleDrumStep}
                pattern={
                  song.drums.patterns[currentScene.machines.drums.variation]
                }
                variation={currentScene.machines.drums.variation}
              />
            ) : null}

            {isPartMachine ? (
              <PartDetail
                machine={song.parts[activeMachineId as PartMachineId]}
                machineId={activeMachineId as PartMachineId}
                onOctaveShiftChange={setPartOctaveShift}
                onTogglePart={togglePartStep}
                variation={
                  currentScene.machines[activeMachineId as PartMachineId]
                    .variation
                }
              />
            ) : null}

            {activeMachineId === "root" ? (
              <RootDetail
                onRootOffsetChange={setRootNoteStep}
                pattern={
                  song.root.patterns[currentScene.machines.root.variation]
                }
                variation={currentScene.machines.root.variation}
              />
            ) : null}

            {activeMachineId === "melody" ? (
              <MelodyDetail
                melodyOctaveShift={song.melody.octaveShift}
                notes={
                  song.melody.patterns[currentScene.machines.melody.variation]
                }
                onMelodyOctaveShift={setMelodyOctaveShift}
                onToggleMelody={toggleMelodyNote}
                variation={currentScene.machines.melody.variation}
              />
            ) : null}
          </div>

          <aside className="flex flex-col gap-4 rounded-2xl border border-stone-800 bg-stone-950/60 p-4">
            <SceneSettingsPanel
              baseBars={currentScene.baseBars}
              loopCount={currentScene.loopCount}
              onBaseBarsChange={setSceneBaseBars}
              onLoopCountChange={setSceneLoopCount}
            />
            <SceneSummaryPanel scene={currentScene} />
          </aside>
        </div>
      </div>
    </section>
  );
}
