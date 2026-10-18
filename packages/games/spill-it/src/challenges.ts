import type { SpillItChallenge } from './manifest'

export interface ChallengeParams {
  size: number
  colors: number
  minPar: number
}

// The only place with these numbers. Changing any of them changes what a score means
// and raises the scoring version (starting values until the first release).
export const challengeParams = {
  a: { size: 6, colors: 4, minPar: 5 },
  b: { size: 10, colors: 5, minPar: 12 },
  c: { size: 14, colors: 6, minPar: 20 },
} as const satisfies Record<SpillItChallenge, ChallengeParams>
