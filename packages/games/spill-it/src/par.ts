import type { Board } from './board'
import { applyColor, isSolved, startRegion } from './flood'

// Deterministic approximation: every step takes the color that makes the region
// absorb the most new cells, a tie goes to the lowest color index.
export function greedyMoves(board: Board, colors: number): number[] {
  const moves: number[] = []
  let current = board
  while (!isSolved(current)) {
    const regionColor = current.cells[0]
    let best: { color: number; board: Board; size: number } | null = null
    for (let color = 0; color < colors; color++) {
      if (color === regionColor) continue
      const next = applyColor(current, color)
      const size = startRegion(next).length
      if (best === null || size > best.size) {
        best = { color, board: next, size }
      }
    }
    if (best === null) {
      throw new Error('greedyMoves needs at least two colors')
    }
    moves.push(best.color)
    current = best.board
  }
  return moves
}

export function greedyPar(board: Board, colors: number): number {
  return greedyMoves(board, colors).length
}
