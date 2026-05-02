import { clampBpm } from "./audio-utils";

export const registerTapTempo = (tapTimes: number[], currentTime: number) => {
  const nextTapTimes = [...tapTimes, currentTime].slice(-4);
  if (nextTapTimes.length < 4) {
    return {
      bpm: null,
      tapTimes: nextTapTimes,
    };
  }

  const intervals = nextTapTimes.slice(1).map((time, index) => {
    return time - nextTapTimes[index];
  });

  const averageInterval =
    intervals.reduce((total, interval) => total + interval, 0) /
    intervals.length;
  const bpm = clampBpm(60000 / averageInterval);

  return {
    bpm,
    tapTimes: nextTapTimes,
  };
};
