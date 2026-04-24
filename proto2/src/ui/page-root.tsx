import { SynthPatternEditorView } from "@/ui/organisms/synth-pattern-editor-view";
import "./styling/page.css";
import "./styling/utility-classes.css";
import { MidiKeyboardView } from "@/ui/organisms/midi-keyboard-view";

export const PageRoot = () => {
  return (
    <div className="w-dvw h-dvh flex-vc gap-4">
      <SynthPatternEditorView />
      <MidiKeyboardView />
    </div>
  );
};
