import { getSceneMachineIds, getSceneMachineTitle } from "../../music";
import type { SceneState } from "../../types";

interface SceneSummaryPanelProps {
  scene: SceneState;
}

export function SceneSummaryPanel({ scene }: SceneSummaryPanelProps) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Scene Summary</p>
      <div className="mt-3 space-y-2 text-sm text-stone-300">
        {getSceneMachineIds().map((machineId) => (
          <div
            className="flex items-center justify-between rounded-xl border border-stone-800 px-3 py-2"
            key={`summary-${machineId}`}
          >
            <span>{getSceneMachineTitle(machineId)}</span>
            <span>
              {scene.machines[machineId].enabled ? "ON" : "OFF"} / V
              {scene.machines[machineId].variation + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}