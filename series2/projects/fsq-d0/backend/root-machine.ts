import { createDefaultScene } from "@fd0/backend/default-scene";
import { createSequencer } from "@fd0/backend/sequencer";
import { createSoundEngine } from "@fd0/backend/sound-engine";
import { DynamicUnit, RootMachine, RootMachineCommand } from "@fd0/types";
import { createCommandDispatcher } from "@lib/ax/command-dispatcher";

export function createRootMachine(): RootMachine {
  const scene = createDefaultScene();
  const soundEngine = createSoundEngine();
  const sequencer = createSequencer(soundEngine);

  function updateUnit(unitId: string, fn: (unit: DynamicUnit) => void) {
    const unit = scene.units.find((u) => u.id === unitId);
    unit && fn(unit);
  }

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
    addUnit(e) {},
    removeUnit(e) {},
    setUnitActive(e) {
      updateUnit(e.unitId, (u) => {
        u.active = e.active;
      });
      // sequencer.handelCommand(e);
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
