import { useGroovebox } from "../context/groovebox-context";
import { SceneSettingsPanel } from "./detail-panel/scene-settings-panel";
import { SceneSummaryPanel } from "./detail-panel/scene-summary-panel";

export function GrooveboxSidebar() {
  const { currentScene, setSceneBaseBars, setSceneLoopCount } = useGroovebox();

  return (
    <aside className="flex min-h-0 flex-col gap-4 border-l border-stone-800 bg-stone-950/50 p-4 lg:p-5">
      <SceneSettingsPanel
        baseBars={currentScene.baseBars}
        loopCount={currentScene.loopCount}
        onBaseBarsChange={setSceneBaseBars}
        onLoopCountChange={setSceneLoopCount}
      />
      <SceneSummaryPanel scene={currentScene} />
    </aside>
  );
}