import type { Round, RoundResult } from '@mindwhile/core'
import type { Board } from './board'
import { levelParams } from './levels'
import { applyColor, isSolved } from './flood'
import { generateBoard } from './generate'
import { pointsFor } from './points'
import type { SpillItLevel } from './manifest'

export interface SpillItSavedState {
  moves: number[]
}

export interface SpillItRound extends Round {
  readonly startBoard: Board
  readonly board: Board
  readonly moves: readonly number[]
  readonly par: number
  readonly size: number
  readonly colors: number
  serialize(): SpillItSavedState
}

function parseMove(move: unknown, colors: number): number {
  if (typeof move === 'object' && move !== null && 'type' in move && 'color' in move) {
    const { type, color } = move
    if (type === 'pick' && typeof color === 'number' && Number.isInteger(color)) {
      if (color >= 0 && color < colors) {
        return color
      }
    }
  }
  throw new Error(`invalid move: ${JSON.stringify(move)}`)
}

function parseSaved(saved: unknown, colors: number): number[] {
  if (
    typeof saved === 'object' &&
    saved !== null &&
    'moves' in saved &&
    Array.isArray(saved.moves)
  ) {
    return saved.moves.map((color) => parseMove({ type: 'pick', color }, colors))
  }
  throw new Error('invalid saved state')
}

export function createRound(p: { level: string; seed: number; saved?: unknown }): SpillItRound {
  if (!Object.hasOwn(levelParams, p.level)) {
    throw new Error(`unknown level: ${p.level}`)
  }
  const level = p.level as SpillItLevel
  const { colors, size } = levelParams[level]
  const { board: startBoard, par } = generateBoard(level, p.seed)
  let board = startBoard
  const moves: number[] = []

  function pick(color: number): void {
    // A move with the color the region already has changes nothing and is not counted.
    // The same holds for moves after the board is solved.
    if (isSolved(board) || color === board.cells[0]) return
    board = applyColor(board, color)
    moves.push(color)
  }

  if (p.saved !== undefined) {
    for (const color of parseSaved(p.saved, colors)) pick(color)
  }

  return {
    startBoard,
    par,
    size,
    colors,
    get board() {
      return board
    },
    get moves() {
      return moves
    },
    apply(move) {
      pick(parseMove(move, colors))
    },
    serialize() {
      return { moves: [...moves] }
    },
    result(): RoundResult | null {
      return isSolved(board)
        ? { roundEnd: 'won', score: [pointsFor(level, moves.length, par), moves.length - par] }
        : null
    },
  }
}
