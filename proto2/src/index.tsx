import { useEffect } from "react";
import { logicActions } from "@/central/logic-actions";
import { midiSoundEngine } from "@/central/periphery/midi-sound-engine";
import { PageRoot } from "@/ui/page-root";
import { mountAppRoot } from "@/utils/mount-app-root";

const App = () => {
  useEffect(() => {
    logicActions.wrapSetupMidiKeyboardInput();
    midiSoundEngine.initialize();
  }, []);
  return <PageRoot />;
};

mountAppRoot(<App />, "app");
