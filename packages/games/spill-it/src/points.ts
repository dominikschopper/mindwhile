import { levelParams } from './levels'
import type { SpillItLevel } from './manifest'

// points = floor(basePoints * par / moves / 10) * 10, integers only, same on every device.
// A solved round always has at least one move (every board has par >= minPar >= 5).
export function pointsFor(level: SpillItLevel, moves: number, par: number): number {
  if (!Number.isInteger(moves) || moves < 1) {
    throw new RangeError(`moves must be a positive integer, got ${moves}`)
  }
  const numerator = levelParams[level].basePoints * par
  const denominator = moves * 10
  return ((numerator - (numerator % denominator)) / denominator) * 10
}
