const levels = ['a', 'b', 'c'] as const

export type SpillItLevel = (typeof levels)[number]

export const manifest = {
  id: 'spill-it',
  symbol: 'grid-2x2',
  gameVersion: 1,
  scoringVersion: 0,
  interfaceVersion: 1,
  levels,
  scoring: [
    { key: 'points', better: 'higher' },
    { key: 'deviation', better: 'lower' },
  ],
} as const
