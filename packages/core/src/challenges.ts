export interface HighestChallengeResult<T> {
  challenge: string
  result: T
}

// `challenges` is in manifest order (ascending). Returns the last challenge in that
// order which has a result. Results for challenges not in the list are ignored.
export function highestChallengeWithResult<T>(
  challenges: readonly string[],
  results: Readonly<Record<string, T | undefined>>,
): HighestChallengeResult<T> | undefined {
  for (let index = challenges.length - 1; index >= 0; index -= 1) {
    const challenge = challenges[index]
    if (challenge === undefined || !Object.hasOwn(results, challenge)) {
      continue
    }
    const result = results[challenge]
    if (result !== undefined) {
      return { challenge, result }
    }
  }
  return undefined
}
