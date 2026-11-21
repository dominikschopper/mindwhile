import { createRng, nextBelow, type Rng } from '@mindwhile/core';
import {
  hasMove,
  isSolved,
  solvedBoard,
  topBlock,
  type Board,
  type Tray,
} from '../common/board/board';
import { levelParams } from '../common/levels/levels';
import type { JellySortLevel } from '../manifest';

export const maxDraws = 1000;

export type Pour = readonly [from: number, to: number];

interface ReverseStep {
  // Layers move from `source` (the forward target) onto `dest` (the forward source).
  source: number;
  dest: number;
  count: number;
}

function candidates(board: Board, previous: ReverseStep | null): ReverseStep[] {
  const found: ReverseStep[] = [];
  const { trays, capacity } = board;
  const tops = trays.map(topBlock);
  for (let source = 0; source < trays.length; source += 1) {
    const block = tops[source];
    if (block == null) {
      continue;
    }
    const sourceLength = trays[source]!.length;
    const onlyBlock = block.length === sourceLength;
    for (let dest = 0; dest < trays.length; dest += 1) {
      if (dest === source) {
        continue;
      }
      if (previous !== null && previous.source === dest && previous.dest === source) {
        continue;
      }
      const targetTop = tops[dest];
      if (targetTop != null && targetTop.color === block.color) {
        continue;
      }
      const targetLength = trays[dest]!.length;
      const most = Math.min(block.length, capacity - targetLength);
      for (let count = 1; count <= most; count += 1) {
        // Taking the whole top block is only legal if nothing else lies below it
        // (the forward target was empty then).
        if (count === block.length && !onlyBlock) {
          continue;
        }
        // A forward pour from a single-color tray into an empty tray is pointless.
        if (targetLength === 0 && count === sourceLength) {
          continue;
        }
        found.push({ source, dest, count });
      }
    }
  }
  return found;
}

function applyReverse(board: Board, step: ReverseStep): Board {
  const color = topBlock(board.trays[step.source]!)!.color;
  const trays: Tray[] = board.trays.map((tray, index) => {
    if (index === step.source) {
      return tray.slice(0, tray.length - step.count);
    }
    if (index === step.dest) {
      return [...tray, ...Array<number>(step.count).fill(color)];
    }
    return tray;
  });
  return { capacity: board.capacity, trays };
}

// Starts from the solved board and plays legal reverse pours (exact inverses of legal
// forward pours) chosen by one seeded stream. A draw that ends solved, without a move
// or stuck is discarded and the next one continues the same stream, never a new seed.
export function generateBoard(
  level: JellySortLevel,
  seed: number,
  limit: number = maxDraws,
): { board: Board; par: number; solution: Pour[] } {
  const { colors, capacity, emptyTrays, minPar } = levelParams[level];
  const rng: Rng = createRng(seed);
  for (let draw = 0; draw < limit; draw += 1) {
    let board = solvedBoard(colors, capacity, emptyTrays);
    const steps: ReverseStep[] = [];
    let previous: ReverseStep | null = null;
    while (steps.length < minPar) {
      const options = candidates(board, previous);
      if (options.length === 0) {
        break;
      }
      const step = options[nextBelow(rng, options.length)]!;
      const next = applyReverse(board, step);
      board = next;
      steps.push(step);
      previous = step;
    }
    if (steps.length >= minPar && !isSolved(board) && hasMove(board)) {
      const solution = steps.reverse().map((s): Pour => [s.dest, s.source]);
      return { board, par: solution.length, solution };
    }
  }
  throw new Error(`no board after ${limit} draws (level ${level}, seed ${seed})`);
}
