import { createDefaultScene } from "@fd0/backend/default-scene";
import { createSequencer } from "@fd0/backend/sequencer";
import { createSoundEngine } from "@fd0/backend/sound-engine";
import { RootMachine } from "@fd0/types";

export function createRootMachine(): RootMachine {
  const soundEngine = createSoundEngine();
  const sequencer = createSequencer(soundEngine);
  const scene = createDefaultScene();

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
      if (command.type === "setPlayState") {
        if (command.playing) {
          sequencer.handelCommand({ type: "start" });
        } else {
          sequencer.handelCommand({ type: "stop" });
        }
      }
      if (command.type === "setUnitActive") {
        sequencer.handelCommand(command);
      }
      if (command.type === "setUnitInstrumentId") {
        if (command.unitId === "primary-tone") {
          scene.primaryToneUnit.instrumentId = command.instrumentId;

          const gmNumber = parseInt(
            command.instrumentId.replace("gm-", ""),
            10,
          );
          soundEngine.selectProgram(scene.primaryToneUnit.channel, gmNumber);
        }
      }
      if (command.type === "playPrimaryTone") {
        soundEngine.playNote(
          scene.primaryToneUnit.channel,
          command.noteNumber,
          command.velocity,
        );
      }
    },
  };
}
