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
// minPar was measured over 5000 seeds per level with the reverse-pour generator: a walk
// of n reverse pours only splits blocks of two or more layers, so it often dead ends before
// n (c: 26 needed ~74 draws per board and 12 s per 5000, 22 needs ~3 draws and ~1 s).
// Share of single-colored trays at the start: a 16%, b 9%, c 6% (a 8: 25%, c 26: 5%).
export const levelParams = {
  a: { colors: 4, capacity: 4, emptyTrays: 2, minPar: 10, basePoints: 500 },
  b: { colors: 6, capacity: 4, emptyTrays: 2, minPar: 16, basePoints: 750 },
  c: { colors: 8, capacity: 5, emptyTrays: 2, minPar: 22, basePoints: 1000 },
} as const satisfies Record<JellySortLevel, LevelParams>;
