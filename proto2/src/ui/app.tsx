import "./styling/page.css";
import "./styling/utility-classes.css";
import { useEffect } from "react";
import { logicActions } from "@/central/logic-actions";
import { MidiKeyboardView } from "@/ui/organisms/midi-keyboard-view";

export const App = () => {
  useEffect(() => {
    logicActions.wrapSetupMidiKeyboardInput();
  }, []);
  return (
    <div>
      <MidiKeyboardView />
    </div>
  );
};
