import type { Round, RoundResult } from '@mindwhile/core';
import { canPour, hasMove, isSolved, pour, type Board } from '../common/board/board';
import { levelParams } from '../common/levels/levels';
import { generateBoard } from '../generator/generate';
import type { JellySortLevel } from '../manifest';
import { pointsFor } from '../scoring/points';

export interface JellySortSavedState {
  moves: [number, number][];
}

export interface JellySortRound extends Round {
  readonly startBoard: Board;
  readonly board: Board;
  readonly moves: readonly (readonly [number, number])[];
  readonly par: number;
  serialize(): JellySortSavedState;
}

function parseIndex(value: unknown, trays: number): number {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < trays) {
    return value;
  }
  throw new Error(`invalid tray index: ${JSON.stringify(value)}`);
}

function parsePour(from: unknown, to: unknown, trays: number): [number, number] {
  return [parseIndex(from, trays), parseIndex(to, trays)];
}

function parseMove(move: unknown, trays: number): [number, number] {
  if (typeof move === 'object' && move !== null && 'type' in move && move.type === 'pour') {
    if ('from' in move && 'to' in move) {
      return parsePour(move.from, move.to, trays);
    }
  }
  throw new Error(`invalid move: ${JSON.stringify(move)}`);
}

function parseSaved(saved: unknown, trays: number): [number, number][] {
  if (
    typeof saved === 'object' &&
    saved !== null &&
    'moves' in saved &&
    Array.isArray(saved.moves)
  ) {
    return saved.moves.map((entry: unknown) => {
      if (Array.isArray(entry) && entry.length === 2) {
        return parsePour(entry[0], entry[1], trays);
      }
      throw new Error('invalid saved state');
    });
  }
  throw new Error('invalid saved state');
}

export function createRound(p: { level: string; seed: number; saved?: unknown }): JellySortRound {
  if (!Object.hasOwn(levelParams, p.level)) {
    throw new Error(`unknown level: ${p.level}`);
  }
  const level = p.level as JellySortLevel;
  const { board: startBoard, par } = generateBoard(level, p.seed);
  const trayCount = startBoard.trays.length;
  let board = startBoard;
  const moves: [number, number][] = [];

  function pourMove(from: number, to: number): void {
    // Moves after the end are ignored, so are pours that change nothing or are not allowed.
    if (isSolved(board) || !hasMove(board) || !canPour(board, from, to)) {
      return;
    }
    board = pour(board, from, to);
    moves.push([from, to]);
  }

  if (p.saved !== undefined) {
    for (const [from, to] of parseSaved(p.saved, trayCount)) {
      pourMove(from, to);
    }
  }

  return {
    startBoard,
    par,
    get board() {
      return board;
    },
    get moves() {
      return moves;
    },
    apply(move) {
      const [from, to] = parseMove(move, trayCount);
      pourMove(from, to);
    },
    serialize() {
      return { moves: moves.map(([from, to]) => [from, to]) };
    },
    result(): RoundResult | null {
      if (isSolved(board)) {
        return {
          roundEnd: 'won',
          score: [pointsFor(level, moves.length, par), moves.length - par],
        };
      }
      return hasMove(board) ? null : { roundEnd: 'lost', score: [0, 0] };
    },
  };
}
