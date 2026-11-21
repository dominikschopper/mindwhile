import type { Board } from '../common/board/board';

const marks = 'abcdefgh';

// One group per tray, layers bottom to top as letters, '.' for an empty tray.
export function boardText(board: Board): string {
  return board.trays
    .map((tray) => (tray.length === 0 ? '.' : tray.map((color) => marks[color]).join('')))
    .join('/');
}

export function pourMove(from: number, to: number) {
  return { type: 'pour', from, to };
}

export function pourMoves(pours: readonly (readonly [number, number])[]) {
  return pours.map(([from, to]) => pourMove(from, to));
}
