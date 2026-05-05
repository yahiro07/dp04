import { seqNumbers } from "@my/lib/ax/array-utils";
import { npx } from "@my/lib/mo/styling-utils";
import { createMemo, mergeProps } from "solid-js";

export const createUnitWaveScopeWavePath = ({
  waveFn,
  shape,
  nx,
  baseSize,
  ny,
  invertY,
}: {
  waveFn: (x: number, shape: number) => number;
  shape: number;
  nx: number;
  baseSize: number;
  ny: number;
  invertY?: boolean;
}) => {
  const width = baseSize * nx;
  const height = baseSize * ny;
  const steps = baseSize * nx;
  const dx = 1 / steps;
  const points = seqNumbers(steps + 1).map((i) => {
    const x = i * dx;
    let y = waveFn(x, shape);
    if (invertY) y = 1 - y;
    return { x: x * width, y: (1 - y) * height };
  });
  return [
    `M 0 ${height}`,
    `L ${points[0].x} ${points[0].y}`,
    ...points.slice(1).map((p) => `L ${p.x} ${p.y}`),
    `L ${width} ${height}`,
    "Z",
  ].join(" ");
};

export const UnitWaveScope = (inputProps: {
  waveFn: (x: number, shape: number) => number;
  shape: number;
  invertY?: boolean;
  nx?: number;
  baseSize?: number;
}) => {
  const props = mergeProps({ invertY: false, nx: 1, baseSize: 36 }, inputProps);

  const width = props.baseSize * props.nx;
  const height = props.baseSize;

  const pathD = createMemo(() => {
    return createUnitWaveScopeWavePath({
      waveFn: props.waveFn,
      shape: props.shape,
      nx: props.nx,
      baseSize: props.baseSize,
      ny: 1,
      invertY: props.invertY,
    });
  });

  return (
    <svg
      width={width}
      height={height}
      style={{
        width: npx(width),
        height: npx(height),
        transform: props.invertY ? "scale(1, -1)" : undefined,
      }}
      viewBox={`0 0 ${width} ${height}`}
    >
      <path
        d={pathD()}
        fill="#0af"
        fill-opacity={0.25}
        stroke="#0af"
        stroke-width={1}
      />
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        stroke="#0af"
        stroke-width={2}
        fill="none"
      />
    </svg>
  );
};
