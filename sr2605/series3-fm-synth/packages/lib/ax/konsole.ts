export const konsoleEnvs = {
  isDebug: false,
};

export const konsole = {
  isDebug: false,

  log(message: string) {
    console.log(`[🔺app] ${message}`);
  },
  debugLog(message: string) {
    if (!konsoleEnvs.isDebug) return;
    console.log(`[🔺app] ${message}`);
  },
};

export function debugAssert(cond: boolean, message: string) {
  if (!konsoleEnvs.isDebug) return;
  if (!cond) {
    throw new Error(message);
  }
}

export function debugEmitError(message: string) {
  if (!konsoleEnvs.isDebug) return;
  throw new Error(message);
}
