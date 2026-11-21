import type { JellySortLevel } from '../../manifest';

export interface LevelParams {
  colors: number;
  capacity: number;
  emptyTrays: number;
  minPar: number;
  basePoints: number;
}

// The only place with these numbers. Changing any of them changes what a score means
// and raises the scoring version (starting values until the first release).
export const levelParams = {
  a: { colors: 4, capacity: 4, emptyTrays: 2, minPar: 8, basePoints: 500 },
  b: { colors: 6, capacity: 4, emptyTrays: 2, minPar: 16, basePoints: 750 },
  c: { colors: 8, capacity: 5, emptyTrays: 2, minPar: 26, basePoints: 1000 },
} as const satisfies Record<JellySortLevel, LevelParams>;
