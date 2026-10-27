// Provisional: there is no storage yet. Replaced by the profile plan, which returns
// the best score list per level from the profile.
export type BestResults = Record<string, Record<string, readonly number[] | undefined>>

export function useBestResults(): BestResults {
  return {}
}

// The first value of a score list is the points. Returns undefined when there is none.
export function pointsOf(result: readonly number[] | undefined): number | undefined {
  return result?.[0]
}
