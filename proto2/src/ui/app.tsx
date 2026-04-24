import "./styling/page.css";
import "./styling/utility-classes.css";
import { useEffect } from "react";
import { appActions } from "@/central/app-actions";
import { MidiKeyboardView } from "@/ui/organisms/midi-keyboard-view";

export const App = () => {
  useEffect(() => {
    appActions.wrapSetupMidiKeyboardInput();
  }, []);
  return (
    <div>
      <MidiKeyboardView />
    </div>
  );
};
