import { createRng, nextBelow } from '@mindwhile/core'
import type { Board } from './board'
import { challengeParams } from './challenges'
import type { SpillItChallenge } from './manifest'
import { greedyPar } from './par'

// Marks belong to the presentation, here they only make the pinned boards readable.
const marks = ['x', '*', 'o', '-', '#', '|']

export function boardText(board: Board): string {
  return Array.from({ length: board.size }, (_, row) =>
    board.cells
      .slice(row * board.size, (row + 1) * board.size)
      .map((color) => marks[color])
      .join(''),
  ).join('/')
}

export function pick(color: number) {
  return { type: 'pick', color }
}

// Par of the first board drawn from the stream, before any redraw.
export function firstDrawPar(challenge: SpillItChallenge, seed: number): number {
  const { size, colors } = challengeParams[challenge]
  const rng = createRng(seed)
  const cells = Array.from({ length: size * size }, () => nextBelow(rng, colors))
  return greedyPar({ size, cells }, colors)
}
