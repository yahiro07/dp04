import WebAudioTinySynth from "webaudio-tinysynth";
import type { PlaybackEvent } from "@/types/midi";

export interface PlaybackController {
  play(events: PlaybackEvent[]): void;
  stop(): void;
  isPlaying(): boolean;
}

interface PlaybackControllerOptions {
  onPlaybackStateChange?: (isPlaying: boolean) => void;
}

interface ScheduledNote {
  channel: number;
  midi: number;
}

export function createPlaybackController(
  options: PlaybackControllerOptions = {},
): PlaybackController {
  const synth = new WebAudioTinySynth({ quality: 1, useReverb: 1, voices: 64 });
  let scheduledTimeouts: number[] = [];
  let scheduledNotes: ScheduledNote[] = [];
  let playing = false;
  const notifyPlaybackStateChange = options.onPlaybackStateChange ?? (() => {});

  const stop = () => {
    for (const timeoutId of scheduledTimeouts) {
      window.clearTimeout(timeoutId);
    }

    for (const note of scheduledNotes) {
      synth.noteOff(note.channel, note.midi, 0);
      synth.allSoundOff(note.channel);
    }

    scheduledTimeouts = [];
    scheduledNotes = [];
    playing = false;
    notifyPlaybackStateChange(false);
  };

  const play = (events: PlaybackEvent[]) => {
    stop();

    if (events.length === 0) {
      return;
    }

    const configuredPrograms = new Set<string>();

    for (const event of events) {
      const key = `${event.channel}:${event.program}`;
      if (!configuredPrograms.has(key)) {
        synth.setProgram(event.channel, event.program);
        configuredPrograms.add(key);
      }

      const noteOnId = window.setTimeout(
        () => {
          synth.noteOn(event.channel, event.midi, event.velocity, 0);
        },
        Math.max(0, Math.round(event.startSeconds * 1000)),
      );
      const noteOffId = window.setTimeout(
        () => {
          synth.noteOff(event.channel, event.midi, 0);
        },
        Math.max(0, Math.round(event.endSeconds * 1000)),
      );

      scheduledTimeouts.push(noteOnId, noteOffId);
      scheduledNotes.push({ channel: event.channel, midi: event.midi });
    }

    const lastEndSeconds = Math.max(...events.map((event) => event.endSeconds));
    const finalizerId = window.setTimeout(
      () => {
        stop();
      },
      Math.round(lastEndSeconds * 1000) + 50,
    );

    scheduledTimeouts.push(finalizerId);
    playing = true;
    notifyPlaybackStateChange(true);
  };

  return {
    play,
    stop,
    isPlaying: () => playing,
  };
}
