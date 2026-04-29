import { createDefaultScene } from "@fd0/backend/default-scene";
import { createSequencer } from "@fd0/backend/sequencer";
import { createSoundEngine } from "@fd0/backend/sound-engine";
import { RootMachine, RootMachineCommand } from "@fd0/types";
import { createCommandDispatcher } from "@lib/ax/command-dispatcher";

export function createRootMachine(): RootMachine {
  const soundEngine = createSoundEngine();
  const sequencer = createSequencer(soundEngine);
  const scene = createDefaultScene();

  const dispatcher = createCommandDispatcher<RootMachineCommand>({
    setPlayState({ playing }) {
      if (playing) {
        sequencer.handelCommand({ type: "start" });
      } else {
        sequencer.handelCommand({ type: "stop" });
      }
    },
    setBpm(e) {},
    playPrimaryTone(e) {
      soundEngine.playNote(
        scene.primaryToneUnit.channel,
        e.noteNumber,
        e.velocity,
      );
    },
    setKey(e) {},
    addPatternUnit(e) {},
    removePatternUnit(e) {},
    setUnitActive(e) {
      sequencer.handelCommand(e);
    },
    setUnitStepNote(e) {},
    setUnitInstrumentId(e) {
      if (e.unitId === "primary-tone") {
        scene.primaryToneUnit.instrumentId = e.instrumentId;
        const gmNumber = parseInt(e.instrumentId.replace("gm-", ""), 10);
        soundEngine.selectProgram(scene.primaryToneUnit.channel, gmNumber);
      }
    },
  });

  return {
    async initialize() {
      await soundEngine.loadAssets();
    },
    async resumeIfNeed() {
      await soundEngine.resumeIfNeed();
    },
    getSceneState() {
      return scene;
    },
    handleCommand(command) {
      dispatcher.apply(command);
    },
  };
}
