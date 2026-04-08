export function calculateDrivenRpm(driverRpm: number, driverTeeth: number, drivenTeeth: number): number {
  return driverRpm * (driverTeeth / drivenTeeth)
}

export function calculateGearRatio(driverTeeth: number, drivenTeeth: number): number {
  return driverTeeth / drivenTeeth
}

export function calculateChainSpeed(rpm: number, numTeeth: number, pitchInches: number): number {
  return rpm * numTeeth * pitchInches
}
