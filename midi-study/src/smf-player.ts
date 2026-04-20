import { CommandItem } from "@/smf-reader";

const CHANNEL_COUNT = 16;
const ALL_SOUND_OFF = 120;
const RESET_ALL_CONTROLLERS = 121;
const ALL_NOTES_OFF = 123;
const DEFAULT_TEMPO_BPM = 120;

type SmfPlayerPayload = {
  commands: CommandItem[];
  timeDivision: number;
  defaultTempo: number;
};

type SmfPlayer = {
  play(payload: SmfPlayerPayload): void;
  stop(): void;
};

function getMillisPerTick(timeDivision: number, defaultTempo: number) {
  if ((timeDivision & 0x8000) === 0) {
    const ticksPerQuarterNote = timeDivision;
    const tempoBpm = defaultTempo > 0 ? defaultTempo : DEFAULT_TEMPO_BPM;
    return 60_000 / (tempoBpm * ticksPerQuarterNote);
  }

  const smpteFormat = (timeDivision >> 8) & 0xff;
  const ticksPerFrame = timeDivision & 0xff;
  const framesPerSecond = (() => {
    switch (smpteFormat) {
      case 0xe8:
        return 24;
      case 0xe7:
        return 25;
      case 0xe3:
        return 30;
      case 0xe2:
        return 29.97;
      default:
        throw new Error(`Unsupported SMPTE time division: 0x${timeDivision.toString(16)}`);
    }
  })();

  if (ticksPerFrame === 0) {
    throw new Error("Invalid SMPTE time division: ticks per frame must be greater than 0");
  }

  return 1000 / (framesPerSecond * ticksPerFrame);
}

export function createSmfPlayer(): SmfPlayer {
  const synth = new (
    window as unknown as {
      WebAudioTinySynth: new () => { send: (data: number[]) => void };
    }
  ).WebAudioTinySynth();
  //usage
  //synth.send([0x90, 36, 100])

  let timerId: number | null = null;
  let playingCommands: CommandItem[] = [];
  let commandIndex = 0;
  let startedAt = 0;
  let millisPerTick = getMillisPerTick(480, DEFAULT_TEMPO_BPM);

  const clearTimer = () => {
    if (timerId != null) {
      window.clearTimeout(timerId);
      timerId = null;
    }
  };

  const sendAllNotesOff = () => {
    for (let channel = 0; channel < CHANNEL_COUNT; channel += 1) {
      synth.send([0xb0 | channel, RESET_ALL_CONTROLLERS, 0]);
      synth.send([0xb0 | channel, ALL_SOUND_OFF, 0]);
      synth.send([0xb0 | channel, ALL_NOTES_OFF, 0]);
    }
  };

  const finishPlayback = () => {
    clearTimer();
    playingCommands = [];
    commandIndex = 0;
    startedAt = 0;
    sendAllNotesOff();
  };

  const scheduleNext = () => {
    if (commandIndex >= playingCommands.length) {
      finishPlayback();
      return;
    }

    const nextTick = playingCommands[commandIndex].tick;
    const targetElapsed = nextTick * millisPerTick;
    const elapsed = performance.now() - startedAt;
    const delay = Math.max(0, targetElapsed - elapsed);

    timerId = window.setTimeout(() => {
      timerId = null;

      while (
        commandIndex < playingCommands.length &&
        playingCommands[commandIndex].tick === nextTick
      ) {
        synth.send(playingCommands[commandIndex].bytes);
        commandIndex += 1;
      }

      scheduleNext();
    }, delay);
  };

  return {
    play(payload) {
      finishPlayback();
      if (payload.commands.length === 0) {
        return;
      }

      millisPerTick = getMillisPerTick(
        payload.timeDivision,
        payload.defaultTempo,
      );
      playingCommands = payload.commands;
      commandIndex = 0;
      startedAt = performance.now();
      scheduleNext();
    },
    stop() {
      finishPlayback();
    },
  };
}
