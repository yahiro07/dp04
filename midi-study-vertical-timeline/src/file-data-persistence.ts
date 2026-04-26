export namespace FileDataPersistence {
  const STORAGE_KEY = "midi-study:file-bytes";

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

  export function saveFileBytes(bytes: Uint8Array) {
    sessionStorage.setItem(STORAGE_KEY, uint8ArrayToBase64(bytes));
  }

  export function loadFileBytes() {
    const encoded = sessionStorage.getItem(STORAGE_KEY);
    if (!encoded) {
      return null;
    }
    return base64ToUint8Array(encoded);
  }

  export function clearFileBytes() {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
