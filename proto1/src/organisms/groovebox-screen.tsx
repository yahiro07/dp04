import { GrooveboxDetailPanel } from "./groovebox-detail-panel";
import { GrooveboxHeader } from "./groovebox-header";
import { MachineSelectionGrid } from "./machine-selection-grid";

export function GrooveboxScreen() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="mx-auto flex min-h-screen max-w-[1100px] items-center justify-center p-4">
        <div className="flex aspect-[4/3] w-full max-w-[1024px] flex-col overflow-hidden rounded-[28px] border border-stone-700 bg-stone-900 shadow-2xl shadow-stone-950/40">
          <GrooveboxHeader />
          <div className="grid flex-1 grid-rows-[1fr_1fr] overflow-hidden">
            <MachineSelectionGrid />
            <GrooveboxDetailPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
