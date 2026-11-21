const levels = ['a', 'b', 'c'] as const;

export type JellySortLevel = (typeof levels)[number];

export const manifest = {
  id: 'jelly-sort',
  symbol: 'flask-conical',
  color: 'green',
  gameVersion: 1,
  scoringVersion: 0,
  interfaceVersion: 1,
  levels,
  scoring: [
    { key: 'points', better: 'higher' },
    { key: 'deviation', better: 'lower' },
  ],
} as const;
