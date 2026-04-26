import { ChipInterface } from "@/types";

type ChipState = {
  clock: number;
  register: number[];
  channelSignal: number[];
  channelPeriod: number[];
  channelCounter: number[];
  noiseSignal: number;
  noisePeriod: number;
  noiseCounter: number;
  noisePhase: number;
  channelEnable: number[];
  noiseEnable: number[];
  volumeTable: number[];
  randomSequence: number;
};

function chip_crate(clock: number): ChipState {
  return {
    clock,
    register: Array(16).fill(0),
    channelSignal: [0, 0, 0],
    channelPeriod: [0, 0, 0],
    channelCounter: [0, 0, 0],
    noiseSignal: 0,
    noisePeriod: 0,
    noiseCounter: 0,
    noisePhase: 0,
    channelEnable: [0, 0, 0],
    noiseEnable: [0, 0, 0],
    volumeTable: [
      0, 0.0078125, 0.0110485, 0.015625, 0.0220971, 0.03125, 0.0441942, 0.0625,
      0.0883883, 0.125, 0.1767767, 0.25, 0.3535534, 0.5, 0.7071068, 1,
    ],
    randomSequence: 1,
  };
}

function chip_setRegister(self: ChipState, num: number, value: number) {
  self.register[num] = value;

  if (num === 0 || num === 1) {
    self.channelPeriod[0] = (self.register[1] << 8) + self.register[0];
  }
  if (num === 2 || num === 3) {
    self.channelPeriod[1] = (self.register[3] << 8) + self.register[2];
  }
  if (num === 4 || num === 5) {
    self.channelPeriod[2] = (self.register[5] << 8) + self.register[4];
  }
  if (num === 6) {
    self.noisePeriod = self.register[6];
  }
  if (num === 7) {
    self.channelEnable[0] = self.register[7] & 1;
    self.channelEnable[1] = (self.register[7] >> 1) & 1;
    self.channelEnable[2] = (self.register[7] >> 2) & 1;
    self.noiseEnable[0] = (self.register[7] >> 3) & 1;
    self.noiseEnable[1] = (self.register[7] >> 4) & 1;
    self.noiseEnable[2] = (self.register[7] >> 5) & 1;
  }
}

function chip_getTick(self: ChipState) {
  var c: number,
    signal: number[] = [],
    result: number = 0;

  for (c = 0; c < 3; c++) {
    self.channelCounter[c]++;
    if (self.channelCounter[c] >= self.channelPeriod[c]) {
      self.channelSignal[c] ^= 1;
      self.channelCounter[c] = 0;
    }
  }

  self.noiseCounter++;
  if (self.noiseCounter >= self.noisePeriod) {
    self.noisePhase ^= 1;
    self.noiseCounter = 0;

    if (self.noisePhase) {
      self.randomSequence ^=
        ((self.randomSequence & 1) ^ ((self.randomSequence >> 3) & 1)) << 17;
      self.randomSequence >>= 1;
    }

    self.noiseSignal = self.randomSequence & 1;
  }

  for (c = 0; c < 3; c++) {
    signal[c] =
      (self.channelSignal[c] | self.channelEnable[c]) &
      (self.noiseSignal | self.noiseEnable[c]);
  }

  for (c = 0; c < 3; c++) {
    result += signal[c] * self.volumeTable[self.register[8 + c]];
  }

  return result / 3;
}

function chip_fillBuffer(
  self: ChipState,
  buffer: Float32Array,
  offset: number,
  length: number,
  sampleRate: number,
) {
  var ticks = self.clock / sampleRate / (16 / 2),
    volume = 0,
    i = 0,
    j = 0;

  while (j < length) {
    volume += chip_getTick(self);
    i++;
    if (i >= ticks) {
      buffer[offset + j] = volume / i;
      volume = 0;
      i = 0;
      j++;
    }
  }

  return buffer;
}

export function createChipAY8910(clock: number): ChipInterface {
  const state = chip_crate(clock);
  return {
    setRegister(address: number, value: number) {
      chip_setRegister(state, address, value);
    },
    fillBuffer(
      buffer: Float32Array,
      offset: number,
      length: number,
      sampleRate: number,
    ) {
      chip_fillBuffer(state, buffer, offset, length, sampleRate);
    },
  };
}
