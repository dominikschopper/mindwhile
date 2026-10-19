/**
 * Returns a fresh seed: one unsigned 32-bit integer from the platform CSPRNG.
 * This is the only source of fresh randomness in the repository.
 */
export function newSeed(): number {
  const [seed] = crypto.getRandomValues(new Uint32Array(1))
  if (seed === undefined) throw new Error('crypto.getRandomValues returned no value')
  return seed
}
