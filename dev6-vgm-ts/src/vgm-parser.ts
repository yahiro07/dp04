import { VgmCommand, VgmHeader, VgmSong } from "@/types";

function createReader(bytes: Uint8Array) {
  const dataView = new DataView(bytes.buffer);
  return {
    getUInt8At(offset: number) {
      return dataView.getUint8(offset);
    },
    getUInt16At(offset: number) {
      return dataView.getUint16(offset, true);
    },
    getUInt32At(offset: number) {
      return dataView.getUint32(offset, true);
    },
    getVersion() {
      return (
        this.getUInt8At(0x09).toString(16) +
        "." +
        this.getUInt8At(0x08).toString(16)
      );
    },
    getSamplesCount() {
      return this.getUInt32At(0x18);
    },
    getDataOffset() {
      return 0x34 + this.getUInt32At(0x34);
    },
    getAY8910Clock() {
      return this.getUInt32At(0x74);
    },
  };
}

export function parseVgm(bytes: Uint8Array): VgmSong {
  const reader = createReader(bytes);

  const version = reader.getVersion();
  const dataOffset = reader.getDataOffset();
  const ay8910Clock = reader.getAY8910Clock();
  const samplesCount = reader.getSamplesCount();

  const header: VgmHeader = {
    version: version,
    samplesCount: samplesCount,
    dataOffset: dataOffset,
    ay8910Clock: ay8910Clock,
  };

  const sampleRate = 44100;

  const commands: VgmCommand[] = [];
  let count = 0;
  let j = dataOffset;

  while (true) {
    if (j > bytes.length) {
      break;
    }
    const opCode = reader.getUInt8At(j);

    if (opCode === 0x66) {
      break;
    } else if (opCode === 0x61) {
      count = reader.getUInt16At(j + 1);
      commands.push({ type: "wait", samples: count });
      j += 3;
    } else if (opCode === 0x62) {
      count = 735;
      commands.push({ type: "wait", samples: count });
      j += 1;
    } else if (opCode === 0x63) {
      count = 882;
      commands.push({ type: "wait", samples: count });
      j += 1;
    } else if (opCode === 0xa0) {
      const address = reader.getUInt8At(j + 1);
      const value = reader.getUInt8At(j + 2);
      commands.push({ type: "setRegister", address: address, value: value });
      j += 3;
    } else if (opCode >= 0x70 && opCode <= 0x7f) {
      count = opCode & 15;
      commands.push({ type: "wait", samples: count });
      j += 1;
    } else {
      console.log(
        "Unknown command " +
          opCode.toString(16) +
          " at offset " +
          j.toString(16),
      );
    }
  }
  return { header, sampleRate, commands };
}
