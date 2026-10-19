// Provisional: there is no storage yet. Replaced by the profile plan, which returns
// the best score per challenge from the profile.
export type BestResults = Record<string, Record<string, number | undefined>>

export function useBestResults(): BestResults {
  return {}
}
