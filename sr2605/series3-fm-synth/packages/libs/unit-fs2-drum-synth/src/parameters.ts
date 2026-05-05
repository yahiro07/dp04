export type UnitParameters = {
  oscPitch: number;
};

export function createDefaultUnitParameters(): UnitParameters {
  return {
    oscPitch: 0.5,
  };
}
