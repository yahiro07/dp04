export function configureAudioSessionPlayback() {
  const _navigator = navigator as { audioSession?: { type: string } };
  if (_navigator.audioSession) {
    _navigator.audioSession.type = "playback";
  }
}

export async function resumeAudioContextIfNeed(audioContext: AudioContext) {
  const st = audioContext.state;
  if (st !== "running" && st !== "closed") {
    try {
      await audioContext.resume();
    } catch (_) {}
  }
}
