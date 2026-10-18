import { neighbors, type Board } from './board'

// Top-left cell plus all connected cells of the same color.
export function startRegion(board: Board): number[] {
  const color = board.cells[0]
  const region = [0]
  const seen = new Set(region)
  for (let i = 0; i < region.length; i++) {
    for (const next of neighbors(board.size, region[i]!)) {
      if (!seen.has(next) && board.cells[next] === color) {
        seen.add(next)
        region.push(next)
      }
    }
  }
  return region
}

// The region takes the color and swallows all connected cells of that color.
export function applyColor(board: Board, color: number): Board {
  const cells = [...board.cells]
  for (const index of startRegion(board)) {
    cells[index] = color
  }
  return { size: board.size, cells }
}

export function isSolved(board: Board): boolean {
  return board.cells.every((cell) => cell === board.cells[0])
}
