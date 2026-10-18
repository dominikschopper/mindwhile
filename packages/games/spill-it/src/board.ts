// Row-major grid of color indices.
export interface Board {
  size: number
  cells: number[]
}

export function neighbors(size: number, index: number): number[] {
  const row = Math.floor(index / size)
  const column = index % size
  const result: number[] = []
  if (row > 0) result.push(index - size)
  if (row < size - 1) result.push(index + size)
  if (column > 0) result.push(index - 1)
  if (column < size - 1) result.push(index + 1)
  return result
}
