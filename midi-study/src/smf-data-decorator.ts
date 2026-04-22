import { CommandItem, SmfSong } from "@/types";

export namespace SmfDataDecorator {
  function formatSignedInt8(value: number) {
    return value > 0x7f ? value - 0x100 : value;
  }

  function getMetaEventComment(item: CommandItem) {
    const metaType = item.bytes[1];
    const data = item.bytes.slice(2);

    if (metaType === 0x51) {
      if (data.length !== 3) {
        throw new Error("Invalid Set Tempo meta event length");
      }

      const microsecondsPerQuarterNote =
        data[0] * 0x10000 + (data[1] << 8) + data[2];
      const bpm = 60000000 / microsecondsPerQuarterNote;
      return `tempo ${bpm.toFixed(2)} bpm`;
    }

    if (metaType === 0x54) {
      if (data.length !== 5) {
        throw new Error("Invalid SMPTE Offset meta event length");
      }

      const frameRates = [24, 25, 29.97, 30] as const;
      const hourByte = data[0];
      const frameRate = frameRates[(hourByte >> 5) & 0x03];
      const hour = hourByte & 0x1f;
      const minute = data[1].toString().padStart(2, "0");
      const second = data[2].toString().padStart(2, "0");
      const frame = data[3].toString().padStart(2, "0");
      const subFrame = data[4].toString().padStart(2, "0");
      return `smpte ${hour.toString().padStart(2, "0")}:${minute}:${second}:${frame}.${subFrame} @ ${frameRate} fps`;
    }

    if (metaType === 0x58) {
      if (data.length !== 4) {
        throw new Error("Invalid Time Signature meta event length");
      }

      const numerator = data[0];
      const denominator = 2 ** data[1];
      return `time signature ${numerator}/${denominator}`;
    }

    if (metaType === 0x59) {
      if (data.length !== 2) {
        throw new Error("Invalid Key Signature meta event length");
      }

      const majorKeys = [
        "Cb",
        "Gb",
        "Db",
        "Ab",
        "Eb",
        "Bb",
        "F",
        "C",
        "G",
        "D",
        "A",
        "E",
        "B",
        "F#",
        "C#",
      ];
      const minorKeys = [
        "Ab",
        "Eb",
        "Bb",
        "F",
        "C",
        "G",
        "D",
        "A",
        "E",
        "B",
        "F#",
        "C#",
        "G#",
        "D#",
        "A#",
      ];
      const accidentalCount = formatSignedInt8(data[0]);
      const mode = data[1] === 1 ? "minor" : "major";
      const keyIndex = accidentalCount + 7;
      const keyNames = data[1] === 1 ? minorKeys : majorKeys;
      const keyName = keyNames[keyIndex];

      if (keyName == null) {
        return `key signature ${accidentalCount} ${mode}`;
      }

      return `key signature ${keyName} ${mode}`;
    }

    return undefined;
  }

  export function decorateCommandItems(commandItems: CommandItem[]) {
    commandItems.forEach((item) => {
      const status = item.bytes[0];

      if (status === 0xff) {
        const comment = getMetaEventComment(item);
        if (comment) {
          item.comment = comment;
        }
        return;
      }

      const data1 = item.bytes[1] ?? 0;
      const data2 = item.bytes[2] ?? 0;
      const ch = status & 0x0f;
      const op = status & 0xf0;
      const comment = (() => {
        if (op === 0xb0) {
          return `ch ${ch} CC#${data1} ${data2} `;
        } else if (op === 0xc0) {
          return `ch ${ch} prog ${data1}`;
        } else if (op === 0x90) {
          if (data2 === 0) {
            return `ch ${ch} note off ${data1}`;
          }
          return `ch ${ch} note on ${data1} ${data2} `;
        } else if (op === 0x80) {
          return `ch ${ch} note off ${data1}`;
        }
      })();
      if (comment) {
        item.comment = comment;
      }
    });
  }

  export function extractDefaultTempo(song: SmfSong): number {
    for (const item of song.commands) {
      if (item.bytes[0] === 0xff && item.bytes[1] === 0x51) {
        if (item.bytes.length !== 5) {
          throw new Error("Invalid Set Tempo meta event length");
        }
        const data = item.bytes.slice(2);
        const microsecondsPerQuarterNote =
          data[0] * 0x10000 + (data[1] << 8) + data[2];
        const bpm = 60_000_000 / microsecondsPerQuarterNote;
        return Math.round(bpm * 100) / 100;
      }
    }
    return 120;
  }
}
