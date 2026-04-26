import { AY8910 } from "@/ay8910";

export class Vgm {
  private sampleRate: number;
  private data: Uint8Array;
  constructor(data: Uint8Array) {
    this.sampleRate = 44100;
    this.data = data;
  }

  getSampleRate() {
    return this.sampleRate;
  }

  getUInt8At(offset: number): number {
    return this.data[offset];
  }

  getUInt16At(offset: number): number {
    return this.data[offset] + (this.data[offset + 1] << 8);
  }

  getUInt32At(offset: number): number {
    return (
      this.data[offset] +
      (this.data[offset + 1] << 8) +
      (this.data[offset + 2] << 16) +
      (this.data[offset + 3] << 24)
    );
  }

  getVersion() {
    return (
      this.getUInt8At(0x09).toString(16) +
      "." +
      this.getUInt8At(0x08).toString(16)
    );
  }
  getSamplesCount() {
    return this.getUInt32At(0x18);
  }

  getDataOffset() {
    return 0x34 + this.getUInt32At(0x34);
  }

  getAY8910Clock() {
    return this.getUInt32At(0x74);
  }

  fillBuffer(buffer: Float32Array, chip: AY8910) {
    var offset = this.getDataOffset(),
      length = this.data.length,
      j = offset,
      command: number,
      i = 0,
      count: number;

    while (true) {
      if (j > length) {
        return;
      }

      command = this.data[j];

      if (command === 0x66) {
        return;
      } else if (command === 0x61) {
        count = this.getUInt16At(j + 1);
        chip.fillBuffer(buffer, i, count, this.sampleRate);
        j += 3;
        i += count;
      } else if (command === 0x62) {
        count = 735;
        chip.fillBuffer(buffer, i, count, this.sampleRate);
        j += 1;
        i += count;
      } else if (command === 0x63) {
        count = 882;
        chip.fillBuffer(buffer, i, count, this.sampleRate);
        j += 1;
        i += count;
      } else if (command === 0xa0) {
        chip.setRegister(this.getUInt8At(j + 1), this.getUInt8At(j + 2));
        j += 3;
      } else if (command >= 0x70 && command <= 0x7f) {
        count = command & 15;
        chip.fillBuffer(buffer, i, count, this.sampleRate);
        j += 1;
        i += count;
      } else {
        console.log(
          "Unknown command " +
            command.toString(16) +
            " at offset " +
            j.toString(16),
        );
      }
    }
  }
}
