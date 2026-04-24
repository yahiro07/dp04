import { setupMidiKeyboardInput } from "@/periphery/midi-keyboard-input";
import "./styling/page.css";
import "./styling/utility-classes.css";
import { useEffect } from "react";
import { appActions } from "@/central/app-actions";
import { mountAppRoot } from "@/utils/mount-app-root";
import { MidiKeyboardView } from "@/views/midi-keyboard-view";

const App = () => {
  useEffect(() => {
    setupMidiKeyboardInput({
      connectionStateCallback: appActions.handleMidiConnectionStateChange,
      noteCallback: appActions.handleMidiNoteInput,
    });
  }, []);
  return (
    <div>
      <MidiKeyboardView />
    </div>
  );
};

mountAppRoot(<App />, "app");
