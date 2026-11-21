/** Width of one tray glass in px: layer 36 + inner padding 8 + walls 2 x 5 (`--glass-wall`, at a 16px root). */
export const TRAY_WIDTH_PX = 54;
/** Gap between trays in px (`--spacing-md` at a 16px root). */
export const TRAY_GAP_PX = 16;
/** Columns used while no width is known (tests, first paint). */
export const DEFAULT_COLUMNS = 5;

/**
 * Number of trays per row. One row if all trays fit, else the fewest rows that fit, with the
 * count spread evenly (the longest row has this many trays). Always at least 1.
 */
export function trayColumns(
  count: number,
  availableWidth: number,
  trayWidth: number = TRAY_WIDTH_PX,
  gap: number = TRAY_GAP_PX,
): number {
  if (count <= 1) {
    return 1;
  }
  const fitting = Math.max(1, Math.floor((availableWidth + gap) / (trayWidth + gap)));
  if (count <= fitting) {
    return count;
  }
  return Math.ceil(count / Math.ceil(count / fitting));
}

/** Tray counts per row for `columns` as the longest row: first and last differ by at most one. */
export function rowSizes(count: number, columns: number): number[] {
  if (count <= 0) {
    return [];
  }
  const rows = Math.ceil(count / Math.max(1, columns));
  const base = Math.floor(count / rows);
  const longer = count % rows;
  return Array.from({ length: rows }, (_, row) => base + (row < longer ? 1 : 0));
}
