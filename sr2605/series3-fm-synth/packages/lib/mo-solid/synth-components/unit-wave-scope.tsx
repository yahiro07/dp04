import { seqNumbers } from "@my/lib/ax/array-utils";
import { npx } from "@my/lib/mo/styling-utils";

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

export const UnitWaveScope = (props: {
  waveFn: (x: number, shape: number) => number;
  shape: number;
  invertY?: boolean;
  nx?: number;
  baseSize?: number;
}) => {
  const vm = {
    waveFn: () => props.waveFn,
    shape: () => props.shape,
    invertY: () => props.invertY ?? false,
    nx: () => props.nx ?? 1,
    baseSize: () => props.baseSize ?? 36,
    pathD() {
      return createUnitWaveScopeWavePath({
        waveFn: vm.waveFn(),
        shape: vm.shape(),
        nx: vm.nx(),
        baseSize: vm.baseSize(),
        ny: 1,
        invertY: vm.invertY(),
      });
    },
  };
  const width = vm.baseSize() * vm.nx();
  const height = vm.baseSize();

  return (
    <svg
      width={width}
      height={height}
      style={{
        width: npx(width),
        height: npx(height),
        transform: vm.invertY() ? "scale(1, -1)" : undefined,
      }}
      viewBox={`0 0 ${width} ${height}`}
    >
      <path
        d={vm.pathD()}
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
