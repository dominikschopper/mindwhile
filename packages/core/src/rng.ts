export interface Rng {
  next(): number
}

const maxSeed = 4294967295

// mulberry32, unsigned 32-bit output. Part of the scoring contract of every game
// that draws from it: changing a single operation changes all generated boards.
export function createRng(seed: number): Rng {
  if (!Number.isInteger(seed) || seed < 0 || seed > maxSeed) {
    throw new RangeError(`seed must be an integer from 0 to ${maxSeed}, got ${seed}`)
  }
  let state = seed | 0
  return {
    next() {
      state = (state + 0x6d2b79f5) | 0
      let t = Math.imul(state ^ (state >>> 15), 1 | state)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return (t ^ (t >>> 14)) >>> 0
    },
  }
}

export function nextBelow(rng: Rng, bound: number): number {
  if (!Number.isInteger(bound) || bound < 1) {
    throw new RangeError(`bound must be a positive integer, got ${bound}`)
  }
  return rng.next() % bound
}
