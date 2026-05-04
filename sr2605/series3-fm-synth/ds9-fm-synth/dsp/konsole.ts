export const dspEnvs = {
  isDebug: false,
};

export const konsole = {
  isDebug: false,

  log(message: string) {
    console.log(`[🔺dsp] ${message}`);
  },
  debugLog(message: string) {
    if (!dspEnvs.isDebug) return;
    console.log(`[🔺dsp] ${message}`);
  },
};

export function debugAssert(cond: boolean, message: string) {
  if (!dspEnvs.isDebug) return;
  if (!cond) {
    throw new Error(message);
  }
}

export function debugEmitError(message: string) {
  if (!dspEnvs.isDebug) return;
  throw new Error(message);
}
