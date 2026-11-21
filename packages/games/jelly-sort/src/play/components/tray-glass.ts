// Index of the first layer (counted from the bottom) of the top block, the run of equal
// colors at the top of the tray. -1 for an empty tray.
export function topBlockStart(layers: readonly number[]): number {
  if (layers.length === 0) {
    return -1;
  }
  const top = layers[layers.length - 1]!;
  let start = layers.length - 1;
  while (start > 0 && layers[start - 1] === top) {
    start--;
  }
  return start;
}
