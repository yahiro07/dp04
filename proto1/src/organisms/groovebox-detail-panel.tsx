import { LabeledSelect } from "../components/labeled-select";
import { PianoRoll } from "../components/piano-roll";
import { RangeField } from "../components/range-field";
import { StepGrid } from "../components/step-grid";
import { useGroovebox } from "../context/groovebox-context";
import { GENERAL_MIDI_PROGRAMS } from "../general-midi";
import { CORE_PROGRAM_TARGETS } from "../lib/groovebox-ui";
import {
  BASE_BARS_OPTIONS,
  DRUM_LANES,
  getMachineTitle,
  getMelodyNoteLabel,
  getPartMachineIds,
  getSceneMachineIds,
  getSceneMachineTitle,
  LOOP_COUNT_OPTIONS,
  MELODY_BASE_NOTE,
  MELODY_ROW_COUNT,
  PART_LANES,
} from "../music";
import type { PartMachineId, VariationIndex } from "../types";

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
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-800 bg-stone-950/60 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
              Detail
            </p>
            <h3 className="mt-1 text-xl font-medium text-stone-100">
              {getMachineTitle(activeMachineId)}
            </h3>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-stone-300">
            <span>Mode: {playback.playbackMode}</span>
            <span>
              MIDI: {playback.midiAvailable ? "connected" : "not detected"}
            </span>
            <span>Scene: {song.currentSceneIndex + 1}</span>
            {playback.queuedSceneIndex !== null ? (
              <span>Queued: {playback.queuedSceneIndex + 1}</span>
            ) : null}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_280px]">
          <div className="min-h-0 overflow-auto rounded-2xl border border-stone-800 bg-stone-950/60 p-4">
            {activeMachineId === "core" ? (
              <div className="grid gap-4 md:grid-cols-2">
                {CORE_PROGRAM_TARGETS.map((target) => (
                  <LabeledSelect
                    key={target.key}
                    label={target.label}
                    onChange={(program) => {
                      setProgramAssignment(target.key, Number(program));
                    }}
                    options={GENERAL_MIDI_PROGRAMS.map((_, index) => index)}
                    renderOption={(program) =>
                      `${program}: ${GENERAL_MIDI_PROGRAMS[program]}`
                    }
                    value={song.core.programs[target.key]}
                  />
                ))}
              </div>
            ) : null}

            {activeMachineId === "drums" ? (
              <StepGrid
                labelColumnClassName="grid-cols-[80px_repeat(16,minmax(0,1fr))]"
                laneLabels={DRUM_LANES}
                onToggle={(laneIndex, stepIndex) => {
                  toggleDrumStep(
                    currentScene.machines.drums.variation,
                    laneIndex,
                    stepIndex,
                  );
                }}
                pattern={
                  song.drums.patterns[currentScene.machines.drums.variation]
                }
              />
            ) : null}

            {isPartMachine ? (
              <PartEditor
                machineId={activeMachineId as PartMachineId}
                onOctaveShiftChange={setPartOctaveShift}
                onTogglePart={togglePartStep}
              />
            ) : null}

            {activeMachineId === "root" ? (
              <div className="grid gap-4 md:grid-cols-4">
                {song.root.patterns[currentScene.machines.root.variation].map(
                  (rootOffset, barIndex) => (
                    <LabeledSelect
                      key={`root-bar-${barIndex}`}
                      label={`Bar ${barIndex + 1}`}
                      onChange={(value) => {
                        setRootNoteStep(
                          currentScene.machines.root.variation,
                          barIndex,
                          Number(value),
                        );
                      }}
                      options={Array.from(
                        { length: 13 },
                        (_, index) => index - 6,
                      )}
                      value={rootOffset}
                    />
                  ),
                )}
              </div>
            ) : null}

            {activeMachineId === "melody" ? (
              <div className="space-y-4">
                <RangeField
                  label="Octave Shift"
                  max={2}
                  min={-2}
                  onChange={setMelodyOctaveShift}
                  value={song.melody.octaveShift}
                />
                <PianoRoll
                  isActive={(stepIndex, midi) =>
                    new Set(
                      song.melody.patterns[
                        currentScene.machines.melody.variation
                      ].map((note) => `${note.step}:${note.midi}`),
                    ).has(`${stepIndex}:${midi}`)
                  }
                  onToggle={(stepIndex, midi) => {
                    toggleMelodyNote(
                      currentScene.machines.melody.variation,
                      stepIndex,
                      midi,
                    );
                  }}
                  rowLabels={Array.from(
                    { length: MELODY_ROW_COUNT },
                    (_, rowIndex) =>
                      getMelodyNoteLabel(
                        MELODY_BASE_NOTE + (MELODY_ROW_COUNT - rowIndex - 1),
                      ),
                  )}
                  rowValues={Array.from(
                    { length: MELODY_ROW_COUNT },
                    (_, rowIndex) =>
                      MELODY_BASE_NOTE + (MELODY_ROW_COUNT - rowIndex - 1),
                  )}
                  stepCount={64}
                />
                <p className="text-xs text-stone-500">
                  PoCではクリックごとに固定8分音符長のノートを配置します。
                </p>
              </div>
            ) : null}
          </div>

          <aside className="flex flex-col gap-4 rounded-2xl border border-stone-800 bg-stone-950/60 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                Scene Settings
              </p>
              <div className="mt-3 space-y-3">
                <LabeledSelect
                  label="Base Bars"
                  onChange={setSceneBaseBars}
                  options={BASE_BARS_OPTIONS}
                  value={currentScene.baseBars}
                />
                <LabeledSelect
                  label="Loop Count"
                  onChange={setSceneLoopCount}
                  options={LOOP_COUNT_OPTIONS}
                  value={currentScene.loopCount}
                />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                Scene Summary
              </p>
              <div className="mt-3 space-y-2 text-sm text-stone-300">
                {getSceneMachineIds().map((machineId) => (
                  <div
                    className="flex items-center justify-between rounded-xl border border-stone-800 px-3 py-2"
                    key={`summary-${machineId}`}
                  >
                    <span>{getSceneMachineTitle(machineId)}</span>
                    <span>
                      {currentScene.machines[machineId].enabled ? "ON" : "OFF"}{" "}
                      / V{currentScene.machines[machineId].variation + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

interface PartEditorProps {
  machineId: PartMachineId;
  onOctaveShiftChange: (machineId: PartMachineId, octaveShift: number) => void;
  onTogglePart: (
    machineId: PartMachineId,
    variation: VariationIndex,
    laneIndex: number,
    stepIndex: number,
  ) => void;
}

function PartEditor({
  machineId,
  onOctaveShiftChange,
  onTogglePart,
}: PartEditorProps) {
  const { currentScene, song } = useGroovebox();
  const machine = song.parts[machineId];
  const variation = currentScene.machines[machineId].variation;

  return (
    <div className="space-y-4">
      <RangeField
        label="Octave Shift"
        max={2}
        min={-2}
        onChange={(octaveShift) => {
          onOctaveShiftChange(machineId, octaveShift);
        }}
        value={machine.octaveShift}
      />
      <StepGrid
        labelColumnClassName="grid-cols-[50px_repeat(16,minmax(0,1fr))]"
        laneLabels={PART_LANES}
        onToggle={(laneIndex, stepIndex) => {
          onTogglePart(machineId, variation, laneIndex, stepIndex);
        }}
        pattern={machine.patterns[variation]}
      />
    </div>
  );
}
