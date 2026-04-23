import { useEffect } from "react";

import { GENERAL_MIDI_PROGRAMS } from "./general-midi";
import {
  BASE_BARS_OPTIONS,
  DRUM_LANES,
  LOOP_COUNT_OPTIONS,
  MELODY_BASE_NOTE,
  MELODY_ROW_COUNT,
  PART_LANES,
  VARIATIONS,
  getMachineTitle,
  getMelodyNoteLabel,
  getPartMachineIds,
  getSceneMachineIds,
  getSceneMachineTitle,
  getVariationLabel,
} from "./music";
import { playbackEngine } from "./playback-engine";
import { useGrooveboxStore } from "./store";
import type { MachineId, PartMachineId, ProgramTarget, SceneMachineId, VariationIndex } from "./types";

export function App() {
  const song = useGrooveboxStore((state) => state.song);
  const playback = useGrooveboxStore((state) => state.playback);
  const setBpm = useGrooveboxStore((state) => state.setBpm);
  const setKey = useGrooveboxStore((state) => state.setKey);
  const setAutoAdvanceScenes = useGrooveboxStore((state) => state.setAutoAdvanceScenes);
  const setActiveMachineId = useGrooveboxStore((state) => state.setActiveMachineId);
  const setSceneMachineEnabled = useGrooveboxStore((state) => state.setSceneMachineEnabled);
  const setSceneMachineVariation = useGrooveboxStore((state) => state.setSceneMachineVariation);
  const setSceneBaseBars = useGrooveboxStore((state) => state.setSceneBaseBars);
  const setSceneLoopCount = useGrooveboxStore((state) => state.setSceneLoopCount);
  const setProgramAssignment = useGrooveboxStore((state) => state.setProgramAssignment);
  const toggleDrumStep = useGrooveboxStore((state) => state.toggleDrumStep);
  const togglePartStep = useGrooveboxStore((state) => state.togglePartStep);
  const setPartOctaveShift = useGrooveboxStore((state) => state.setPartOctaveShift);
  const setRootNoteStep = useGrooveboxStore((state) => state.setRootNoteStep);
  const toggleMelodyNote = useGrooveboxStore((state) => state.toggleMelodyNote);
  const setMelodyOctaveShift = useGrooveboxStore((state) => state.setMelodyOctaveShift);

  useEffect(() => {
    playbackEngine.init();
  }, []);

  const currentScene = song.scenes[song.currentSceneIndex];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="mx-auto flex min-h-screen max-w-[1100px] items-center justify-center p-4">
        <div className="flex aspect-[4/3] w-full max-w-[1024px] flex-col overflow-hidden rounded-[28px] border border-stone-700 bg-stone-900 shadow-2xl shadow-stone-950/40">
          <header className="grid grid-cols-[auto_auto_auto_1fr] gap-4 border-b border-stone-800 bg-stone-900/95 px-5 py-4">
            <button
              className={primaryButton(playback.isPlaying)}
              onClick={() => {
                void playbackEngine.togglePlay();
              }}
              type="button"
            >
              {playback.isPlaying ? "Stop" : "Play"}
            </button>
            <div className="flex items-center gap-2 rounded-2xl border border-stone-800 bg-stone-950/60 px-3 py-2">
              <span className="text-xs uppercase tracking-[0.24em] text-stone-400">BPM</span>
              <input
                className="w-24 accent-amber-500"
                max={180}
                min={60}
                onChange={(event) => {
                  setBpm(Number(event.target.value));
                }}
                type="range"
                value={song.bpm}
              />
              <span className="w-9 text-right font-mono text-sm">{song.bpm}</span>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-stone-800 bg-stone-950/60 px-3 py-2">
              <label className="text-xs uppercase tracking-[0.24em] text-stone-400" htmlFor="song-key">
                Key
              </label>
              <select
                className="rounded-lg border border-stone-700 bg-stone-900 px-2 py-1 text-sm"
                id="song-key"
                onChange={(event) => {
                  setKey(event.target.value as "Am" | "C");
                }}
                value={song.key}
              >
                <option value="Am">Am</option>
                <option value="C">C</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <label className="flex items-center gap-2 rounded-2xl border border-stone-800 bg-stone-950/60 px-3 py-2 text-sm text-stone-200">
                <input
                  checked={song.autoAdvanceScenes}
                  className="accent-amber-500"
                  onChange={(event) => {
                    setAutoAdvanceScenes(event.target.checked);
                  }}
                  type="checkbox"
                />
                Auto Scene
              </label>
              {song.scenes.map((_, sceneIndex) => {
                const isActive = song.currentSceneIndex === sceneIndex;
                const isQueued = playback.queuedSceneIndex === sceneIndex;
                return (
                  <button
                    className={sceneButton(isActive, isQueued)}
                    key={`scene-${sceneIndex + 1}`}
                    onClick={() => {
                      playbackEngine.requestSceneChange(sceneIndex);
                    }}
                    type="button"
                  >
                    {sceneIndex + 1}
                  </button>
                );
              })}
            </div>
          </header>

          <div className="grid flex-1 grid-rows-[1fr_1fr] overflow-hidden">
            <section className="overflow-auto border-b border-stone-800 p-4">
              <div className="grid h-full auto-rows-fr gap-3 md:grid-cols-4">
                {renderCoreCard(song.activeMachineId, setActiveMachineId)}
                {getSceneMachineIds().map((machineId) =>
                  renderMachineCard({
                    activeMachineId: song.activeMachineId,
                    machineId,
                    sceneMachine: currentScene.machines[machineId],
                    onSelect: setActiveMachineId,
                    onToggle: (enabled) => {
                      setSceneMachineEnabled(song.currentSceneIndex, machineId, enabled);
                    },
                    onVariationSelect: (variation) => {
                      setSceneMachineVariation(song.currentSceneIndex, machineId, variation);
                    },
                  }),
                )}
              </div>
            </section>

            <section className="overflow-auto p-4">
              {renderDetailPanel({
                activeMachineId: song.activeMachineId,
                currentSceneIndex: song.currentSceneIndex,
                currentScene,
                midiAvailable: playback.midiAvailable,
                playbackMode: playback.playbackMode,
                queuedSceneIndex: playback.queuedSceneIndex,
                programs: song.core.programs,
                parts: song.parts,
                drums: song.drums.patterns,
                melodyPatterns: song.melody.patterns,
                melodyOctaveShift: song.melody.octaveShift,
                rootPatterns: song.root.patterns,
                onMelodyOctaveShift: setMelodyOctaveShift,
                onPartOctaveShift: setPartOctaveShift,
                onProgramChange: setProgramAssignment,
                onRootOffsetChange: setRootNoteStep,
                onSceneBaseBars: (baseBars) => {
                  setSceneBaseBars(song.currentSceneIndex, baseBars);
                },
                onSceneLoopCount: (loopCount) => {
                  setSceneLoopCount(song.currentSceneIndex, loopCount);
                },
                onToggleDrum: toggleDrumStep,
                onToggleMelody: toggleMelodyNote,
                onTogglePart: togglePartStep,
              })}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderCoreCard(activeMachineId: MachineId, onSelect: (machineId: MachineId) => void) {
  return (
    <button
      className={cardClass(activeMachineId === "core")}
      onClick={() => {
        onSelect("core");
      }}
      type="button"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Machine</p>
        <h2 className="mt-2 text-lg font-medium text-stone-100">音源コア</h2>
      </div>
      <p className="text-sm text-stone-400">ch2〜ch5 の GM プログラム割当</p>
    </button>
  );
}

function renderMachineCard({
  activeMachineId,
  machineId,
  sceneMachine,
  onSelect,
  onToggle,
  onVariationSelect,
}: {
  activeMachineId: MachineId;
  machineId: SceneMachineId;
  sceneMachine: { enabled: boolean; variation: VariationIndex };
  onSelect: (machineId: MachineId) => void;
  onToggle: (enabled: boolean) => void;
  onVariationSelect: (variation: VariationIndex) => void;
}) {
  return (
    <div className={cardClass(activeMachineId === machineId)}>
      <button
        className="flex-1 text-left"
        onClick={() => {
          onSelect(machineId);
        }}
        type="button"
      >
        <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Machine</p>
        <h2 className="mt-2 text-lg font-medium text-stone-100">{getSceneMachineTitle(machineId)}</h2>
      </button>
      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          className={toggleButton(sceneMachine.enabled)}
          onClick={() => {
            onToggle(!sceneMachine.enabled);
          }}
          type="button"
        >
          {sceneMachine.enabled ? "ON" : "OFF"}
        </button>
        <div className="grid grid-cols-4 gap-1">
          {VARIATIONS.map((variation) => (
            <button
              className={chipButton(sceneMachine.variation === variation)}
              key={`${machineId}-variation-${variation}`}
              onClick={() => {
                onVariationSelect(variation as VariationIndex);
              }}
              type="button"
            >
              {getVariationLabel(variation)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderDetailPanel({
  activeMachineId,
  currentScene,
  currentSceneIndex,
  drums,
  melodyOctaveShift,
  melodyPatterns,
  midiAvailable,
  onMelodyOctaveShift,
  onPartOctaveShift,
  onProgramChange,
  onRootOffsetChange,
  onSceneBaseBars,
  onSceneLoopCount,
  onToggleDrum,
  onToggleMelody,
  onTogglePart,
  parts,
  playbackMode,
  programs,
  queuedSceneIndex,
  rootPatterns,
}: {
  activeMachineId: MachineId;
  currentScene: (typeof useGrooveboxStore.getState extends () => infer T ? T : never)["song"]["scenes"][number];
  currentSceneIndex: number;
  drums: boolean[][][];
  melodyOctaveShift: number;
  melodyPatterns: { midi: number; step: number; durationSteps: number }[][];
  midiAvailable: boolean;
  onMelodyOctaveShift: (octaveShift: number) => void;
  onPartOctaveShift: (machineId: PartMachineId, octaveShift: number) => void;
  onProgramChange: (target: ProgramTarget, program: number) => void;
  onRootOffsetChange: (variation: VariationIndex, barIndex: number, rootOffset: number) => void;
  onSceneBaseBars: (baseBars: 1 | 2 | 4 | 8 | 16) => void;
  onSceneLoopCount: (loopCount: 1 | 2 | 4) => void;
  onToggleDrum: (variation: VariationIndex, laneIndex: number, stepIndex: number) => void;
  onToggleMelody: (variation: VariationIndex, stepIndex: number, midi: number) => void;
  onTogglePart: (machineId: PartMachineId, variation: VariationIndex, laneIndex: number, stepIndex: number) => void;
  parts: (typeof useGrooveboxStore.getState extends () => infer T ? T : never)["song"]["parts"];
  playbackMode: "manual" | "auto";
  programs: Record<ProgramTarget, number>;
  queuedSceneIndex: number | null;
  rootPatterns: number[][];
}) {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-800 bg-stone-950/60 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Detail</p>
          <h3 className="mt-1 text-xl font-medium text-stone-100">{getMachineTitle(activeMachineId)}</h3>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-stone-300">
          <span>Mode: {playbackMode}</span>
          <span>MIDI: {midiAvailable ? "connected" : "not detected"}</span>
          <span>Scene: {currentSceneIndex + 1}</span>
          {queuedSceneIndex !== null ? <span>Queued: {queuedSceneIndex + 1}</span> : null}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div className="min-h-0 overflow-auto rounded-2xl border border-stone-800 bg-stone-950/60 p-4">
          {activeMachineId === "core" && renderCoreDetail(programs, onProgramChange)}
          {activeMachineId === "drums" && renderDrumDetail(currentScene.machines.drums.variation, drums, onToggleDrum)}
          {getPartMachineIds().includes(activeMachineId as PartMachineId) &&
            renderPartDetail(
              activeMachineId as PartMachineId,
              currentScene.machines[activeMachineId as PartMachineId].variation,
              parts[activeMachineId as PartMachineId],
              onTogglePart,
              onPartOctaveShift,
            )}
          {activeMachineId === "root" && renderRootDetail(currentScene.machines.root.variation, rootPatterns, onRootOffsetChange)}
          {activeMachineId === "melody" &&
            renderMelodyDetail(
              currentScene.machines.melody.variation,
              melodyPatterns,
              melodyOctaveShift,
              onToggleMelody,
              onMelodyOctaveShift,
            )}
        </div>
        <aside className="flex flex-col gap-4 rounded-2xl border border-stone-800 bg-stone-950/60 p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Scene Settings</p>
            <div className="mt-3 space-y-3">
              <label className="flex flex-col gap-1 text-sm text-stone-300">
                <span>Base Bars</span>
                <select
                  className="rounded-xl border border-stone-700 bg-stone-900 px-3 py-2"
                  onChange={(event) => {
                    onSceneBaseBars(Number(event.target.value) as 1 | 2 | 4 | 8 | 16);
                  }}
                  value={currentScene.baseBars}
                >
                  {BASE_BARS_OPTIONS.map((baseBars) => (
                    <option key={`base-bars-${baseBars}`} value={baseBars}>
                      {baseBars}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm text-stone-300">
                <span>Loop Count</span>
                <select
                  className="rounded-xl border border-stone-700 bg-stone-900 px-3 py-2"
                  onChange={(event) => {
                    onSceneLoopCount(Number(event.target.value) as 1 | 2 | 4);
                  }}
                  value={currentScene.loopCount}
                >
                  {LOOP_COUNT_OPTIONS.map((loopCount) => (
                    <option key={`loop-count-${loopCount}`} value={loopCount}>
                      {loopCount}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Scene Summary</p>
            <div className="mt-3 space-y-2 text-sm text-stone-300">
              {getSceneMachineIds().map((machineId) => (
                <div className="flex items-center justify-between rounded-xl border border-stone-800 px-3 py-2" key={`summary-${machineId}`}>
                  <span>{getSceneMachineTitle(machineId)}</span>
                  <span>
                    {currentScene.machines[machineId].enabled ? "ON" : "OFF"} / V
                    {currentScene.machines[machineId].variation + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function renderCoreDetail(
  programs: Record<ProgramTarget, number>,
  onProgramChange: (target: ProgramTarget, program: number) => void,
) {
  const targets: { key: ProgramTarget; label: string }[] = [
    { key: "partA", label: "ch2 Program" },
    { key: "partB", label: "ch3 Program" },
    { key: "partC", label: "ch4 Program" },
    { key: "melody", label: "ch5 Program" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {targets.map((target) => (
        <label className="flex flex-col gap-2" key={target.key}>
          <span className="text-sm text-stone-300">{target.label}</span>
          <select
            className="rounded-xl border border-stone-700 bg-stone-900 px-3 py-2 text-sm"
            onChange={(event) => {
              onProgramChange(target.key, Number(event.target.value));
            }}
            value={programs[target.key]}
          >
            {GENERAL_MIDI_PROGRAMS.map((name, index) => (
              <option key={`${target.key}-program-${name}`} value={index}>
                {index}: {name}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}

function renderDrumDetail(
  variation: VariationIndex,
  patterns: boolean[][][],
  onToggleDrum: (variation: VariationIndex, laneIndex: number, stepIndex: number) => void,
) {
  const pattern = patterns[variation];
  return (
    <div className="space-y-3">
      {pattern.map((lane, laneIndex) => (
        <div className="grid grid-cols-[80px_repeat(16,minmax(0,1fr))] gap-1" key={`drum-lane-${DRUM_LANES[laneIndex]}`}>
          <div className="flex items-center text-sm text-stone-300">{DRUM_LANES[laneIndex]}</div>
          {lane.map((isActive, stepIndex) => (
            <button
              className={stepCellClass(isActive, stepIndex)}
              key={`drum-step-${laneIndex}-${stepIndex}`}
              onClick={() => {
                onToggleDrum(variation, laneIndex, stepIndex);
              }}
              type="button"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function renderPartDetail(
  machineId: PartMachineId,
  variation: VariationIndex,
  machine: { patterns: boolean[][][]; octaveShift: number },
  onTogglePart: (machineId: PartMachineId, variation: VariationIndex, laneIndex: number, stepIndex: number) => void,
  onPartOctaveShift: (machineId: PartMachineId, octaveShift: number) => void,
) {
  const pattern = machine.patterns[variation];

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 text-sm text-stone-300">
        <span>Octave Shift</span>
        <input
          className="accent-amber-500"
          max={2}
          min={-2}
          onChange={(event) => {
            onPartOctaveShift(machineId, Number(event.target.value));
          }}
          step={1}
          type="range"
          value={machine.octaveShift}
        />
        <span className="w-8 text-right font-mono">{machine.octaveShift}</span>
      </label>
      {pattern.map((lane, laneIndex) => (
        <div className="grid grid-cols-[50px_repeat(16,minmax(0,1fr))] gap-1" key={`${machineId}-lane-${PART_LANES[laneIndex]}`}>
          <div className="flex items-center text-sm text-stone-300">{PART_LANES[laneIndex]}</div>
          {lane.map((isActive, stepIndex) => (
            <button
              className={stepCellClass(isActive, stepIndex)}
              key={`${machineId}-step-${laneIndex}-${stepIndex}`}
              onClick={() => {
                onTogglePart(machineId, variation, laneIndex, stepIndex);
              }}
              type="button"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function renderRootDetail(
  variation: VariationIndex,
  rootPatterns: number[][],
  onRootOffsetChange: (variation: VariationIndex, barIndex: number, rootOffset: number) => void,
) {
  const pattern = rootPatterns[variation];
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {pattern.map((rootOffset, barIndex) => (
        <label className="flex flex-col gap-2" key={`root-bar-${barIndex}`}>
          <span className="text-sm text-stone-300">Bar {barIndex + 1}</span>
          <select
            className="rounded-xl border border-stone-700 bg-stone-900 px-3 py-2 text-sm"
            onChange={(event) => {
              onRootOffsetChange(variation, barIndex, Number(event.target.value));
            }}
            value={rootOffset}
          >
            {Array.from({ length: 13 }, (_, index) => index - 6).map((value) => (
              <option key={`root-offset-${barIndex}-${value}`} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}

function renderMelodyDetail(
  variation: VariationIndex,
  melodyPatterns: { midi: number; step: number; durationSteps: number }[][],
  melodyOctaveShift: number,
  onToggleMelody: (variation: VariationIndex, stepIndex: number, midi: number) => void,
  onMelodyOctaveShift: (octaveShift: number) => void,
) {
  const notes = melodyPatterns[variation];
  const noteSet = new Set(notes.map((note) => `${note.step}:${note.midi}`));
  const steps = Array.from({ length: 64 }, (_, stepIndex) => stepIndex);
  const rows = Array.from({ length: MELODY_ROW_COUNT }, (_, rowIndex) => MELODY_BASE_NOTE + (MELODY_ROW_COUNT - rowIndex - 1));

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 text-sm text-stone-300">
        <span>Octave Shift</span>
        <input
          className="accent-amber-500"
          max={2}
          min={-2}
          onChange={(event) => {
            onMelodyOctaveShift(Number(event.target.value));
          }}
          step={1}
          type="range"
          value={melodyOctaveShift}
        />
        <span className="w-8 text-right font-mono">{melodyOctaveShift}</span>
      </label>
      <div className="overflow-auto rounded-xl border border-stone-800">
        <div className="grid min-w-[960px] grid-cols-[64px_repeat(64,minmax(0,1fr))] gap-px bg-stone-900 p-px">
          <div className="bg-stone-950" />
          {steps.map((stepIndex) => (
            <div className="flex h-8 items-center justify-center bg-stone-950 text-[10px] text-stone-500" key={`melody-head-${stepIndex}`}>
              {stepIndex + 1}
            </div>
          ))}
          {rows.map((midi) => (
            <>
              <div className="flex h-8 items-center justify-center bg-stone-950 px-2 text-[10px] text-stone-400" key={`melody-label-${midi}`}>
                {getMelodyNoteLabel(midi)}
              </div>
              {steps.map((stepIndex) => {
                const isActive = noteSet.has(`${stepIndex}:${midi}`);
                return (
                  <button
                    className={pianoRollCellClass(isActive, stepIndex)}
                    key={`melody-cell-${midi}-${stepIndex}`}
                    onClick={() => {
                      onToggleMelody(variation, stepIndex, midi);
                    }}
                    type="button"
                  />
                );
              })}
            </>
          ))}
        </div>
      </div>
      <p className="text-xs text-stone-500">PoCではクリックごとに固定8分音符長のノートを配置します。</p>
    </div>
  );
}

function primaryButton(isPlaying: boolean) {
  return `rounded-2xl px-5 py-3 text-sm font-medium transition ${
    isPlaying ? "bg-red-500 text-red-950" : "bg-amber-500 text-amber-950"
  }`;
}

function sceneButton(isActive: boolean, isQueued: boolean) {
  return `flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-medium transition ${
    isActive
      ? "border-amber-500 bg-amber-500 text-amber-950"
      : isQueued
        ? "border-amber-700 bg-amber-950/70 text-amber-200"
        : "border-stone-700 bg-stone-950/70 text-stone-300 hover:border-stone-500"
  }`;
}

function cardClass(active: boolean) {
  return `flex min-h-[150px] flex-col justify-between rounded-2xl border p-4 text-left transition ${
    active
      ? "border-amber-500 bg-amber-950/30 shadow-lg shadow-amber-950/20"
      : "border-stone-800 bg-stone-950/60 hover:border-stone-700"
  }`;
}

function toggleButton(enabled: boolean) {
  return `rounded-xl px-3 py-1 text-xs font-medium ${
    enabled ? "bg-emerald-500/90 text-emerald-950" : "bg-stone-800 text-stone-300"
  }`;
}

function chipButton(active: boolean) {
  return `rounded-lg px-2 py-1 text-xs ${
    active ? "bg-amber-500 text-amber-950" : "bg-stone-800 text-stone-300"
  }`;
}

function stepCellClass(active: boolean, stepIndex: number) {
  return `aspect-square rounded-[10px] border transition ${
    active ? "border-amber-400 bg-amber-500" : "border-stone-800 bg-stone-900"
  } ${stepIndex % 4 === 0 ? "ring-1 ring-stone-700/70" : ""}`;
}

function pianoRollCellClass(active: boolean, stepIndex: number) {
  return `h-8 border transition ${
    active ? "border-sky-300 bg-sky-400" : "border-stone-900 bg-stone-950"
  } ${stepIndex % 4 === 0 ? "bg-stone-900" : ""}`;
}