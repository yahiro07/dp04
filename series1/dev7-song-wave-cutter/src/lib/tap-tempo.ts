import { configs } from "../configs";
import { clampBpm } from "./audio-utils";

export const registerTapTempo = (tapTimes: number[], currentTime: number) => {
  const nextTapTimes = [...tapTimes, currentTime].slice(
    -configs.tapHistorySize,
  );
  if (nextTapTimes.length < 2) {
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
