import { MachineCard } from "../components/machine-card";
import { useGroovebox } from "../context/groovebox-context";
import { getSceneMachineIds, getSceneMachineTitle } from "../music";

export function MachineSelectionGrid() {
  const {
    currentScene,
    setActiveMachineId,
    setSceneMachineEnabled,
    setSceneMachineVariation,
    song,
  } = useGroovebox();

  return (
    <section className="h-[360px] shrink-0 overflow-auto border-b border-stone-800 p-4">
      <div className="grid auto-rows-fr gap-3 md:grid-cols-4">
        <MachineCard
          active={song.activeMachineId === "core"}
          description="ch2〜ch5 の GM プログラム割当"
          onSelect={() => {
            setActiveMachineId("core");
          }}
          title="音源コア"
        />
        {getSceneMachineIds().map((machineId) => (
          <MachineCard
            active={song.activeMachineId === machineId}
            enabled={currentScene.machines[machineId].enabled}
            key={machineId}
            onSelect={() => {
              setActiveMachineId(machineId);
            }}
            onToggle={(enabled) => {
              setSceneMachineEnabled(machineId, enabled);
            }}
            onVariationSelect={(variation) => {
              setSceneMachineVariation(machineId, variation);
            }}
            selectedVariation={currentScene.machines[machineId].variation}
            title={getSceneMachineTitle(machineId)}
          />
        ))}
      </div>
    </section>
  );
}
