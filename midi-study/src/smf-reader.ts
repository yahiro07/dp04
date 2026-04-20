export type CommandItem = {
  tick: number;
  bytes: number[];
};

export namespace SmfReader {
  const TRACK_HEADER = "MTrk";
  const HEADER_CHUNK = "MThd";

  class ByteReader {
    private offset = 0;

    constructor(private readonly bytes: Uint8Array) {}

    get position() {
      return this.offset;
    }

    get remaining() {
      return this.bytes.length - this.offset;
    }

    readUint8() {
      this.ensureRemaining(1);
      return this.bytes[this.offset++];
    }

    readUint16() {
      this.ensureRemaining(2);
      const value =
        (this.bytes[this.offset] << 8) | this.bytes[this.offset + 1];
      this.offset += 2;
      return value;
    }

    readUint32() {
      this.ensureRemaining(4);
      const value =
        this.bytes[this.offset] * 0x1000000 +
        (this.bytes[this.offset + 1] << 16) +
        (this.bytes[this.offset + 2] << 8) +
        this.bytes[this.offset + 3];
      this.offset += 4;
      return value;
    }

    readString(length: number) {
      const chars = this.readBytes(length);
      return String.fromCharCode(...chars);
    }

    readBytes(length: number) {
      this.ensureRemaining(length);
      const value = this.bytes.slice(this.offset, this.offset + length);
      this.offset += length;
      return value;
    }

    skip(length: number) {
      this.ensureRemaining(length);
      this.offset += length;
    }

    readVariableLengthQuantity() {
      let value = 0;
      for (let i = 0; i < 4; i += 1) {
        const byte = this.readUint8();
        value = (value << 7) | (byte & 0x7f);
        if ((byte & 0x80) === 0) {
          return value;
        }
      }
      throw new Error("Invalid variable-length quantity");
    }

    private ensureRemaining(length: number) {
      if (this.remaining < length) {
        throw new Error("Unexpected end of MIDI data");
      }
    }
  }

  function getMessageDataLength(statusByte: number) {
    const upper = statusByte & 0xf0;
    if (upper === 0xc0 || upper === 0xd0) {
      return 1;
    }
    if (upper >= 0x80 && upper <= 0xe0) {
      return 2;
    }
    return 0;
  }

  function parseTrack(trackBytes: Uint8Array): CommandItem[] {
    const reader = new ByteReader(trackBytes);
    const commands: CommandItem[] = [];
    let tick = 0;
    let runningStatus: number | null = null;

    while (reader.remaining > 0) {
      tick += reader.readVariableLengthQuantity();
      const firstByte = reader.readUint8();

      if (firstByte === 0xff) {
        runningStatus = null;
        const metaType = reader.readUint8();
        const length = reader.readVariableLengthQuantity();
        reader.skip(length);
        if (metaType === 0x2f) {
          break;
        }
        continue;
      }

      if (firstByte === 0xf0 || firstByte === 0xf7) {
        runningStatus = null;
        const length = reader.readVariableLengthQuantity();
        const data = reader.readBytes(length);
        commands.push({ tick, bytes: [firstByte, ...data] });
        continue;
      }

      let statusByte = firstByte;
      let dataBytes: number[];

      if ((firstByte & 0x80) === 0) {
        if (runningStatus == null) {
          throw new Error("Running status encountered before status byte");
        }
        statusByte = runningStatus;
        const dataLength = getMessageDataLength(statusByte);
        if (dataLength === 0) {
          throw new Error(
            `Unsupported running status: 0x${statusByte.toString(16)}`,
          );
        }
        dataBytes = [firstByte, ...reader.readBytes(dataLength - 1)];
      } else {
        runningStatus = statusByte;
        const dataLength = getMessageDataLength(statusByte);
        if (dataLength === 0) {
          throw new Error(
            `Unsupported MIDI status byte: 0x${statusByte.toString(16)}`,
          );
        }
        dataBytes = [...reader.readBytes(dataLength)];
      }

      commands.push({
        tick,
        bytes: [statusByte, ...dataBytes],
      });
    }

    return commands;
  }

  export function loadFromArrayBuffer(buffer: ArrayBuffer): CommandItem[] {
    const reader = new ByteReader(new Uint8Array(buffer));
    const chunkType = reader.readString(4);
    if (chunkType !== HEADER_CHUNK) {
      throw new Error("MIDI header chunk (MThd) not found");
    }

    const headerLength = reader.readUint32();
    if (headerLength < 6) {
      throw new Error("Invalid MIDI header length");
    }

    const formatType = reader.readUint16();
    const trackCount = reader.readUint16();
    reader.readUint16();
    if (headerLength > 6) {
      reader.skip(headerLength - 6);
    }

    if (![0, 1, 2].includes(formatType)) {
      throw new Error(`Unsupported MIDI format: ${formatType}`);
    }

    const allCommands: CommandItem[] = [];
    for (let trackIndex = 0; trackIndex < trackCount; trackIndex += 1) {
      const trackType = reader.readString(4);
      if (trackType !== TRACK_HEADER) {
        throw new Error(`Track chunk ${trackIndex} is invalid`);
      }
      const trackLength = reader.readUint32();
      const trackBytes = reader.readBytes(trackLength);
      allCommands.push(...parseTrack(trackBytes));
    }

    return allCommands.sort((a, b) => a.tick - b.tick);
  }

  export async function loadFromFile(file: File): Promise<CommandItem[]> {
    const buffer = await file.arrayBuffer();
    return loadFromArrayBuffer(buffer);
  }
}
