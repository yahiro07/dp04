import { VgmSong } from "@/vgm-parser";

function getComment(bytes: Uint8Array): string | undefined {
  const firstByte = bytes[0];

  if ((firstByte & 0xf0) === 0x70) {
    const tick = firstByte & 0x0f;
    return `wait ${tick} samples`;
  } else if (firstByte === 0x5a) {
    const aa = bytes[1];
    const dd = bytes[2];
    return `write register ${aa.toString(16).padStart(2, "0")}: ${dd}`;
  } else if (firstByte === 0x61) {
    const ss = (bytes[2] << 8) | bytes[1];
    return `wait ${ss} samples`;
  } else if (firstByte === 0x66) {
    return "end of sound data";
  }
  return undefined;
}

export function applyVgmDataHint(vgmSong: VgmSong) {
  for (const command of vgmSong.commands) {
    command.comment = getComment(command.bytes);
  }
}
