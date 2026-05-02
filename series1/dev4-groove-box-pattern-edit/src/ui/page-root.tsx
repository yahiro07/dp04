import { MidiKeyboardView } from "@/ui/organisms/midi-keyboard-view";
import { SynthPatternEditorView } from "@/ui/organisms/synth-pattern-editor-view";

export const PageRoot = () => {
  return (
    <div className="w-dvw h-dvh flex-vc gap-4">
      <SynthPatternEditorView />
      <MidiKeyboardView />
    </div>
  );
};
