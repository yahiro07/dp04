import { GrooveboxDetailPanel } from "./groovebox-detail-panel";
import { GrooveboxHeader } from "./groovebox-header";
import { GrooveboxSidebar } from "./groovebox-sidebar";
import { MachineSelectionGrid } from "./machine-selection-grid";

export function GrooveboxScreen() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="min-h-screen p-4 lg:p-6">
        <div className="grid min-h-[calc(100vh-2rem)] grid-cols-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[28px] border border-stone-700 bg-stone-900 shadow-2xl shadow-stone-950/40 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[auto_minmax(0,1fr)]">
          <div className="lg:col-span-2">
            <GrooveboxHeader />
          </div>
          <div className="flex min-h-0 flex-col overflow-hidden">
            <MachineSelectionGrid />
            <GrooveboxDetailPanel />
          </div>
          <GrooveboxSidebar />
        </div>
      </div>
    </div>
  );
}
