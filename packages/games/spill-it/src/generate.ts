import { createRng, nextBelow } from '@mindwhile/core'
import type { Board } from './board'
import { challengeParams } from './challenges'
import type { SpillItChallenge } from './manifest'
import { greedyPar } from './par'

export const maxDraws = 1000

// Draws full boards from one seeded stream (cells row by row, color = next() mod colors).
// A board whose greedy par is below the minimum of the challenge is discarded and the
// next board is drawn from the same stream, never from a new seed.
export function generateBoard(
  challenge: SpillItChallenge,
  seed: number,
  limit: number = maxDraws,
): { board: Board; par: number } {
  const { size, colors, minPar } = challengeParams[challenge]
  const rng = createRng(seed)
  for (let draw = 0; draw < limit; draw++) {
    const board: Board = {
      size,
      cells: Array.from({ length: size * size }, () => nextBelow(rng, colors)),
    }
    const par = greedyPar(board, colors)
    if (par >= minPar) {
      return { board, par }
    }
  }
  throw new Error(
    `no board with par >= ${minPar} after ${limit} draws (challenge ${challenge}, seed ${seed})`,
  )
}
