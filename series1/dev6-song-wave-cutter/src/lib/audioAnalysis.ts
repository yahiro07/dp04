/** Error thrown by analyzeAudio. May carry partial debug data for display. */
export class AnalysisError extends Error {
  debugData?: AnalysisDebugData;
  constructor(message: string, debugData?: AnalysisDebugData) {
    super(message);
    this.name = "AnalysisError";
    this.debugData = debugData;
  }
}

export interface AnalysisDebugData {
  /** RMS energy per frame (normalized 0–1) */
  energy: Float32Array;
  /** Onset strength per frame (normalized 0–1) */
  onset: Float32Array;
  /** Frame indices of detected peaks */
  peakFrames: number[];
  /** Threshold used for peak picking (normalized 0–1) */
  threshold: number;
  /** Duration of each frame in seconds */
  frameSizeSec: number;
}

export interface AnalysisResult {
  bpm: number;
  startSamplesOffset: number;
  debugData: AnalysisDebugData;
}

/**
 * Analyzes the first ~2 seconds of an AudioBuffer to detect BPM and
 * the sample offset of the first kick drum hit.
 *
 * Strategy:
 * 1. Mix to mono and apply a low-pass filter (~150 Hz) via OfflineAudioContext
 *    to isolate kick drum energy.
 * 2. Compute RMS energy in 10 ms non-overlapping frames.
 * 3. Derive onset strength as the positive-going first derivative of energy.
 * 4. Pick peaks with a threshold and minimum inter-peak interval (150 ms).
 * 5. Derive BPM from the median peak-to-peak interval.
 * 6. Map the first peak back to sample position → startSamplesOffset.
 */
export async function analyzeAudio(
  buffer: AudioBuffer,
): Promise<AnalysisResult> {
  const sampleRate = buffer.sampleRate;
  const analysisDuration = 2; // seconds
  const analysisSamples = Math.min(
    Math.floor(analysisDuration * sampleRate),
    buffer.length,
  );

  if (analysisSamples < Math.floor(sampleRate * 0.3)) {
    throw new AnalysisError(
      "Audio too short for analysis (need at least 0.3 s)",
    );
  }

  // --- Mix channels to mono ---
  const nChannels = buffer.numberOfChannels;
  const monoRaw = new Float32Array(analysisSamples);
  for (let i = 0; i < analysisSamples; i++) {
    let s = 0;
    for (let ch = 0; ch < nChannels; ch++) {
      s += buffer.getChannelData(ch)[i];
    }
    monoRaw[i] = s / nChannels;
  }

  // --- Check for silence ---
  let maxAbs = 0;
  for (let i = 0; i < analysisSamples; i++) {
    const a = Math.abs(monoRaw[i]);
    if (a > maxAbs) maxAbs = a;
  }
  if (maxAbs < 0.001) {
    throw new AnalysisError("No audio signal detected in the first 2 seconds");
  }

  // --- Low-pass filter via OfflineAudioContext ---
  const offlineCtx = new OfflineAudioContext(1, analysisSamples, sampleRate);
  const monoBuffer = offlineCtx.createBuffer(1, analysisSamples, sampleRate);
  monoBuffer.copyToChannel(monoRaw, 0);

  const src = offlineCtx.createBufferSource();
  src.buffer = monoBuffer;

  const lpf = offlineCtx.createBiquadFilter();
  lpf.type = "lowpass";
  lpf.frequency.value = 100;
  lpf.Q.value = 0.7;

  src.connect(lpf);
  lpf.connect(offlineCtx.destination);
  src.start(0);

  const rendered = await offlineCtx.startRendering();
  const filtered = rendered.getChannelData(0);

  // --- RMS energy in 10 ms frames ---
  const frameSize = Math.max(1, Math.floor(sampleRate * 0.01));
  const numFrames = Math.floor(analysisSamples / frameSize);
  const energy = new Float32Array(numFrames);

  for (let f = 0; f < numFrames; f++) {
    let sum = 0;
    const base = f * frameSize;
    for (let i = 0; i < frameSize; i++) {
      sum += filtered[base + i] ** 2;
    }
    energy[f] = Math.sqrt(sum / frameSize);
  }

  // --- Onset strength (positive half-wave rectified derivative) ---
  const onset = new Float32Array(numFrames);
  for (let f = 1; f < numFrames; f++) {
    onset[f] = Math.max(0, energy[f] - energy[f - 1]);
  }

  const maxOnset = Math.max(...onset);

  // Build partial debug data (no peaks / threshold yet) for error cases
  const buildPartialDebug = (): AnalysisDebugData => {
    const maxE = Math.max(...energy, 1e-10);
    const normE = new Float32Array(numFrames);
    for (let f = 0; f < numFrames; f++) normE[f] = energy[f] / maxE;
    const mo = Math.max(maxOnset, 1e-10);
    const normO = new Float32Array(numFrames);
    for (let f = 0; f < numFrames; f++) normO[f] = onset[f] / mo;
    return {
      energy: normE,
      onset: normO,
      peakFrames: [],
      threshold: 0,
      frameSizeSec: 0.01,
    };
  };

  if (maxOnset < 1e-5) {
    throw new AnalysisError(
      "Could not detect any transients in the low-frequency band",
      buildPartialDebug(),
    );
  }

  // --- Peak picking ---
  const threshold = maxOnset * 0.5;
  // 150 ms minimum interval between kick hits
  const minPeakInterval = Math.max(1, Math.floor(0.15 / 0.01)); // frames
  const peaks: number[] = [];

  for (let f = 1; f < numFrames - 1; f++) {
    if (
      onset[f] > threshold &&
      onset[f] >= onset[f - 1] &&
      onset[f] >= onset[f + 1] &&
      (peaks.length === 0 || f - peaks[peaks.length - 1] >= minPeakInterval)
    ) {
      peaks.push(f);
    }
  }

  if (peaks.length < 2) {
    // Build partial debug with threshold and found peaks (may be 0 or 1)
    const maxE = Math.max(...energy, 1e-10);
    const normE = new Float32Array(numFrames);
    for (let f = 0; f < numFrames; f++) normE[f] = energy[f] / maxE;
    const normO = new Float32Array(numFrames);
    for (let f = 0; f < numFrames; f++) normO[f] = onset[f] / maxOnset;
    throw new AnalysisError(
      "Could not detect enough kick drum beats to determine BPM (found fewer than 2)",
      {
        energy: normE,
        onset: normO,
        peakFrames: peaks,
        threshold: threshold / maxOnset,
        frameSizeSec: 0.01,
      },
    );
  }

  // --- BPM from median peak interval ---
  const intervals = peaks.slice(1).map((p, i) => p - peaks[i]);
  const sorted = [...intervals].sort((a, b) => a - b);
  const medianInterval = sorted[Math.floor(sorted.length / 2)];

  const framesPerSec = 1 / 0.01; // 100 frames/s
  const bpm = Math.round((framesPerSec / medianInterval) * 60);

  if (bpm < 40 || bpm > 240) {
    // Build full debug data including all peaks
    const maxE2 = Math.max(...energy, 1e-10);
    const normE2 = new Float32Array(numFrames);
    for (let f = 0; f < numFrames; f++) normE2[f] = energy[f] / maxE2;
    const normO2 = new Float32Array(numFrames);
    for (let f = 0; f < numFrames; f++) normO2[f] = onset[f] / maxOnset;
    throw new AnalysisError(
      `Detected BPM (${bpm}) is out of expected range (40–240)`,
      {
        energy: normE2,
        onset: normO2,
        peakFrames: peaks,
        threshold: threshold / maxOnset,
        frameSizeSec: 0.01,
      },
    );
  }

  const startSamplesOffset = peaks[0] * frameSize;

  // --- Normalize for debug display ---
  const maxEnergy = Math.max(...energy, 1e-10);
  const normEnergy = new Float32Array(numFrames);
  for (let f = 0; f < numFrames; f++) normEnergy[f] = energy[f] / maxEnergy;

  const normOnset = new Float32Array(numFrames);
  for (let f = 0; f < numFrames; f++) normOnset[f] = onset[f] / maxOnset;

  return {
    bpm,
    startSamplesOffset,
    debugData: {
      energy: normEnergy,
      onset: normOnset,
      peakFrames: peaks,
      threshold: threshold / maxOnset,
      frameSizeSec: 0.01,
    },
  };
}
