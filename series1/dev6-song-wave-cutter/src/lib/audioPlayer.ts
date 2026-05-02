// Singleton AudioContext shared across the app
let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

// ── Song player ──────────────────────────────────────────────────────────────

let songBuffer: AudioBuffer | null = null;
let songSource: AudioBufferSourceNode | null = null;
let songContextStartTime = 0; // audioCtx.currentTime when play() was called
let songBufferOffset = 0; // buffer offset (seconds) at last play()

export function setSongBuffer(buffer: AudioBuffer): void {
  stopSong();
  songBuffer = buffer;
  songBufferOffset = 0;
}

export function getSongBuffer(): AudioBuffer | null {
  return songBuffer;
}

/** Decode an ArrayBuffer and store it as the song buffer. */
export async function loadAndDecodeFile(file: File): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  const ab = await file.arrayBuffer();
  const decoded = await ctx.decodeAudioData(ab);
  setSongBuffer(decoded);
  return decoded;
}

/** Start / resume song playback. Calls onEnded when the song finishes. */
export function playSong(onEnded: () => void): void {
  if (!songBuffer) return;
  const ctx = getAudioContext();
  void ctx.resume();

  _stopSongNode();
  songSource = ctx.createBufferSource();
  songSource.buffer = songBuffer;
  songSource.connect(ctx.destination);
  songSource.onended = () => {
    songSource = null;
    songBufferOffset = 0; // reset to start on natural end
    onEnded();
  };
  songContextStartTime = ctx.currentTime;
  songSource.start(0, songBufferOffset);
}

/** Pause song and remember current position. */
export function pauseSong(): void {
  if (!songSource || !songBuffer) return;
  const ctx = getAudioContext();
  const elapsed = ctx.currentTime - songContextStartTime;
  songBufferOffset = (songBufferOffset + elapsed) % songBuffer.duration;
  _stopSongNode();
}

/** Stop song and reset to beginning. */
export function stopSong(): void {
  _stopSongNode();
  songBufferOffset = 0;
}

function _stopSongNode(): void {
  if (songSource) {
    songSource.onended = null;
    try {
      songSource.stop();
    } catch {
      /* already stopped */
    }
    songSource = null;
  }
}

// ── Phrase player ────────────────────────────────────────────────────────────

let phraseSource: AudioBufferSourceNode | null = null;

/**
 * Play a region of the given buffer.
 * @param startSample  First sample of the region.
 * @param durationSamples  Length in samples.
 * @param loop  Whether to loop the region.
 * @param onEnded  Called when playback ends (not called if stopPhrase() is used).
 */
export function playPhrase(
  buffer: AudioBuffer,
  startSample: number,
  durationSamples: number,
  loop: boolean,
  onEnded: () => void,
): void {
  const ctx = getAudioContext();
  void ctx.resume();

  _stopPhraseNode();
  const sampleRate = buffer.sampleRate;
  const startSec = startSample / sampleRate;
  const durationSec = durationSamples / sampleRate;

  phraseSource = ctx.createBufferSource();
  phraseSource.buffer = buffer;
  phraseSource.loop = loop;
  if (loop) {
    phraseSource.loopStart = startSec;
    phraseSource.loopEnd = startSec + durationSec;
  }
  phraseSource.connect(ctx.destination);
  phraseSource.onended = () => {
    phraseSource = null;
    onEnded();
  };
  // For non-looping, the duration argument to start() limits playback length.
  phraseSource.start(0, startSec, loop ? undefined : durationSec);
}

export function stopPhrase(): void {
  _stopPhraseNode();
}

function _stopPhraseNode(): void {
  if (phraseSource) {
    phraseSource.onended = null;
    try {
      phraseSource.stop();
    } catch {
      /* already stopped */
    }
    phraseSource = null;
  }
}
