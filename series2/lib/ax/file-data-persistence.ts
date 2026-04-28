function uint8ArrayToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (const [index, char] of Array.from(binary).entries()) {
    bytes[index] = char.charCodeAt(0);
  }
  return bytes;
}

export function createFileDataPersistence(storageKey: string) {
  const saveFileBytes = (bytes: Uint8Array) => {
    sessionStorage.setItem(storageKey, uint8ArrayToBase64(bytes));
  };

  const loadFileBytes = () => {
    const encoded = sessionStorage.getItem(storageKey);
    if (!encoded) {
      return null;
    }
    return base64ToUint8Array(encoded);
  };

  const clearFileBytes = () => {
    sessionStorage.removeItem(storageKey);
  };

  return {
    saveFileBytes,
    loadFileBytes,
    clearFileBytes,
  };
}
