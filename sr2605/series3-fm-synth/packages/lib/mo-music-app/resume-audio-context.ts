export async function resumeAudioContextIfNeed(audioContext: AudioContext) {
  const st = audioContext.state;
  if (st !== "running" && st !== "closed") {
    try {
      await audioContext.resume();
    } catch (_) {}
  }
}
