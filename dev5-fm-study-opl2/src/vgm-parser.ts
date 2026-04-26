export type VgmHeader = {
  version: string;
  headerLength: number;
};

export type VgmCommand = {
  bytes: Uint8Array;
  comment?: string;
};

export type VgmSong = {
  header: VgmHeader;
  commands: VgmCommand[];
};

const VGM_MIN_HEADER_LENGTH = 0x40;
const VGM_EXTENDED_HEADER_LENGTH = 0x80;
const VGM_IDENT = "Vgm ";
const VGM_DATA_OFFSET_FIELD = 0x34;
const VGM_1_50 = 0x00000150;
const VGM_1_51 = 0x00000151;
const VGM_DATA_BLOCK_HEADER_LENGTH = 7;

function formatVgmVersion(version: number) {
  const major = (version >> 8) & 0xff;
  const minor = version & 0xff;
  return `${major}.${minor.toString(16).toUpperCase().padStart(2, "0")}`;
}

function getVgmCommandLength(bytes: Uint8Array, relativeOffset: number) {
  const command = bytes[relativeOffset];

  if (command === undefined) return null;

  if (command === 0x4f || command === 0x50) return 2;
  if (command >= 0x51 && command <= 0x5f) return 3;
  if (command === 0x61) return 3;
  if (command === 0x62 || command === 0x63 || command === 0x66) return 1;
  if (command === 0x68) return 12;
  if (command >= 0x70 && command <= 0x8f) return 1;
  if (command === 0x90 || command === 0x91 || command === 0x95) return 5;
  if (command === 0x92) return 6;
  if (command === 0x93) return 11;
  if (command === 0x94) return 2;
  if (
    command === 0xa0 ||
    command === 0xb0 ||
    command === 0xb1 ||
    command === 0xb2
  ) {
    return 3;
  }
  if (command >= 0xa1 && command <= 0xaf) return 3;
  if (command >= 0xb3 && command <= 0xbf) return 3;
  if (command === 0xc0 || command === 0xc1 || command === 0xc2) return 4;
  if (command >= 0xc3 && command <= 0xcf) return 4;
  if (command === 0xd0 || command === 0xd1) return 4;
  if (command >= 0xd2 && command <= 0xdf) return 4;
  if (command === 0xe0) return 5;
  if (command >= 0xe1 && command <= 0xff) return 5;
  if (command >= 0x30 && command <= 0x4e) return 2;

  return null;
}

function parseCommands(
  bytes: Uint8Array,
  dataByteOffset: number,
): VgmCommand[] {
  const dataBytes = bytes.slice(dataByteOffset);
  const commands: VgmCommand[] = [];
  let cursor = 0;

  while (cursor < dataBytes.length) {
    const command = dataBytes[cursor];

    if (command === 0x67) {
      if (cursor + VGM_DATA_BLOCK_HEADER_LENGTH > dataBytes.length) {
        break;
      }

      if (dataBytes[cursor + 1] !== 0x66) {
        break;
      }

      const blockSize = new DataView(
        dataBytes.buffer,
        dataBytes.byteOffset + cursor + 3,
        4,
      ).getUint32(0, true);
      const blockByteLength = VGM_DATA_BLOCK_HEADER_LENGTH + blockSize;

      if (cursor + blockByteLength > dataBytes.length) {
        break;
      }

      commands.push({
        bytes: dataBytes.slice(cursor, cursor + blockByteLength),
      });

      cursor += blockByteLength;
      continue;
    }

    const commandLength = getVgmCommandLength(dataBytes, cursor);

    if (commandLength === null || cursor + commandLength > dataBytes.length) {
      break;
    }

    commands.push({
      bytes: dataBytes.slice(cursor, cursor + commandLength),
    });

    cursor += commandLength;
  }

  if (cursor < dataBytes.length) {
    commands.push({
      bytes: dataBytes.slice(cursor),
    });
  }

  return commands;
}

export const vgmParser = {
  decodeVgmData(bytes: Uint8Array): VgmSong {
    if (bytes.length < VGM_MIN_HEADER_LENGTH) {
      throw new Error("VGM file is too short to contain a valid header.");
    }

    const ident = String.fromCharCode(...bytes.slice(0, 4));

    if (ident !== VGM_IDENT) {
      throw new Error("Invalid VGM header signature.");
    }

    const dataView = new DataView(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength,
    );
    const version = dataView.getUint32(0x08, true);
    const relativeDataOffset = dataView.getUint32(VGM_DATA_OFFSET_FIELD, true);
    const dataByteOffset =
      version >= VGM_1_50
        ? VGM_DATA_OFFSET_FIELD + relativeDataOffset
        : VGM_MIN_HEADER_LENGTH;

    if (
      dataByteOffset < VGM_MIN_HEADER_LENGTH ||
      dataByteOffset > bytes.length
    ) {
      throw new Error("VGM data offset is out of range.");
    }

    const headerByteLength = Math.min(
      dataByteOffset,
      version >= VGM_1_51 ? VGM_EXTENDED_HEADER_LENGTH : VGM_MIN_HEADER_LENGTH,
    );
    const commands = parseCommands(bytes, dataByteOffset);

    return {
      header: {
        version: formatVgmVersion(version),
        headerLength: headerByteLength,
      },
      commands,
    };
  },
};
