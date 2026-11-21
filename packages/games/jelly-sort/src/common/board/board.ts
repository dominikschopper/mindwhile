export type Tray = readonly number[];

// A tray lists its layers (color indices) from bottom to top.
export interface Board {
  capacity: number;
  trays: readonly Tray[];
}

export interface TopBlock {
  color: number;
  length: number;
}

// The contiguous layers of the same color on top of a tray, or null for an empty tray.
export function topBlock(tray: Tray): TopBlock | null {
  if (tray.length === 0) {
    return null;
  }
  const color = tray[tray.length - 1]!;
  let length = 1;
  while (length < tray.length && tray[tray.length - 1 - length] === color) {
    length += 1;
  }
  return { color, length };
}

function isTrayIndex(board: Board, index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < board.trays.length;
}

function isSingleColor(tray: Tray): boolean {
  return tray.every((color) => color === tray[0]);
}

export function canPour(board: Board, from: number, to: number): boolean {
  if (!isTrayIndex(board, from) || !isTrayIndex(board, to) || from === to) {
    return false;
  }
  const source = board.trays[from]!;
  const target = board.trays[to]!;
  const block = topBlock(source);
  if (block === null) {
    return false;
  }
  if (target.length === 0) {
    // Pointless pour: a single-color tray into an empty tray changes nothing.
    if (isSingleColor(source)) {
      return false;
    }
  } else if (topBlock(target)!.color !== block.color) {
    return false;
  }
  return block.length <= board.capacity - target.length;
}

export function pour(board: Board, from: number, to: number): Board {
  if (!canPour(board, from, to)) {
    throw new Error(`Invalid pour from tray ${from} to tray ${to}`);
  }
  const block = topBlock(board.trays[from]!)!;
  const trays = board.trays.map((tray, index) => {
    if (index === from) {
      return tray.slice(0, tray.length - block.length);
    }
    if (index === to) {
      return [...tray, ...Array<number>(block.length).fill(block.color)];
    }
    return tray;
  });
  return { capacity: board.capacity, trays };
}

export function isSolved(board: Board): boolean {
  return board.trays.every(
    (tray) => tray.length === 0 || (tray.length === board.capacity && isSingleColor(tray)),
  );
}

export function hasMove(board: Board): boolean {
  for (let from = 0; from < board.trays.length; from += 1) {
    for (let to = 0; to < board.trays.length; to += 1) {
      if (canPour(board, from, to)) {
        return true;
      }
    }
  }
  return false;
}

// Color i fills tray i, followed by the empty trays.
export function solvedBoard(colors: number, capacity: number, emptyTrays: number): Board {
  const trays: Tray[] = [];
  for (let color = 0; color < colors; color += 1) {
    trays.push(Array<number>(capacity).fill(color));
  }
  for (let i = 0; i < emptyTrays; i += 1) {
    trays.push([]);
  }
  return { capacity, trays };
}
