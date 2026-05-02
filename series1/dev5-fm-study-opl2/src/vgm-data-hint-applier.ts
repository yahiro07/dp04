import { VgmSong } from "@/vgm-parser";

function getRegisterOpMeta(register: number, value: number) {
  if (0xb0 <= register && register <= 0xb8) {
    const ch = register & 0x0f;
    const isKeyOn = ((value >> 5) & 1) === 1;
    const fnumH = value & 0x03;
    return `ch${ch}: key${isKeyOn ? 1 : 0} fnumH:${fnumH}`;
  }
  if (0xa0 <= register && register <= 0xa8) {
    const ch = register & 0x0f;
    const fnumL = value;
    return `ch${ch}: fnumL:${fnumL}`;
  }
}

function getComment(bytes: Uint8Array): string | undefined {
  const firstByte = bytes[0];

  if ((firstByte & 0xf0) === 0x70) {
    const tick = firstByte & 0x0f;
    return `wait ${tick} samples`;
  }
  if (firstByte === 0x5a) {
    const aa = bytes[1];
    const dd = bytes[2];
    const strAddr = aa.toString(16).padStart(2, "0");
    const strValue = dd.toString(16).padStart(2, "0");
    const strMeta = getRegisterOpMeta(aa, dd);
    return `write register ${strAddr}: ${strValue} ${strMeta ? `-- ${strMeta}` : ""}`;
  }
  if (firstByte === 0x61) {
    const ss = (bytes[2] << 8) | bytes[1];
    return `wait ${ss} samples`;
  }
  if (firstByte === 0x66) {
    return "end of sound data";
  }
  return undefined;
}

export function applyVgmDataHint(vgmSong: VgmSong) {
  for (const command of vgmSong.commands) {
    command.comment = getComment(command.bytes);
  }
}
