export interface HighestLevelResult<T> {
  level: string
  result: T
}

// `levels` is in manifest order (ascending). Returns the last level in that
// order which has a result. Results for levels not in the list are ignored.
export function highestLevelWithResult<T>(
  levels: readonly string[],
  results: Readonly<Record<string, T | undefined>>,
): HighestLevelResult<T> | undefined {
  for (let index = levels.length - 1; index >= 0; index -= 1) {
    const level = levels[index]
    if (level === undefined || !Object.hasOwn(results, level)) {
      continue
    }
    const result = results[level]
    if (result !== undefined) {
      return { level, result }
    }
  }
  return undefined
}
