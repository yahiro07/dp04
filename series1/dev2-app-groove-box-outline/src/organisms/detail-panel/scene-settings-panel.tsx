import { LabeledSelect } from "../../components/labeled-select";
import { BASE_BARS_OPTIONS, LOOP_COUNT_OPTIONS } from "../../music";
import type { BaseBars, LoopCount } from "../../types";

interface SceneSettingsPanelProps {
  baseBars: BaseBars;
  loopCount: LoopCount;
  onBaseBarsChange: (baseBars: BaseBars) => void;
  onLoopCountChange: (loopCount: LoopCount) => void;
}

export function SceneSettingsPanel({
  baseBars,
  loopCount,
  onBaseBarsChange,
  onLoopCountChange,
}: SceneSettingsPanelProps) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Scene Settings</p>
      <div className="mt-3 space-y-3">
        <LabeledSelect label="Base Bars" onChange={onBaseBarsChange} options={BASE_BARS_OPTIONS} value={baseBars} />
        <LabeledSelect label="Loop Count" onChange={onLoopCountChange} options={LOOP_COUNT_OPTIONS} value={loopCount} />
      </div>
    </div>
  );
}