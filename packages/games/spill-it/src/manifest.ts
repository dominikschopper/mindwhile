const challenges = ['a', 'b', 'c'] as const

export type SpillItChallenge = (typeof challenges)[number]

export const manifest = {
  id: 'spill-it',
  gameVersion: 1,
  scoringVersion: 0,
  interfaceVersion: 1,
  challenges,
  scoring: [{ key: 'deviation', better: 'lower' }],
} as const
