let errorReported = false;
export function checkBufferSignalsValid(buffer: Float32Array) {
  for (let i = 0; i < buffer.length; i++) {
    if (!Number.isFinite(buffer[i])) {
      if (!errorReported) {
        console.error(`invalid samples detected`);
        errorReported = true;
      }
      buffer[i] = 0;
    }
  }
}
