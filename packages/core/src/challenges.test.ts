import { describe, expect, it } from 'vitest'
import { highestChallengeWithResult } from './challenges'

const challenges = ['a', 'b', 'c'] as const

describe('highestChallengeWithResult', () => {
  it('picks the last challenge in manifest order that has a result', () => {
    expect(highestChallengeWithResult(challenges, { a: 1, b: 2 })).toEqual({
      challenge: 'b',
      result: 2,
    })
    expect(highestChallengeWithResult(challenges, { a: 1, b: 2, c: 3 })).toEqual({
      challenge: 'c',
      result: 3,
    })
  })

  it('skips challenges without a result', () => {
    expect(highestChallengeWithResult(challenges, { a: 7, c: undefined })).toEqual({
      challenge: 'a',
      result: 7,
    })
    expect(highestChallengeWithResult(challenges, { a: 7, b: undefined })).toEqual({
      challenge: 'a',
      result: 7,
    })
  })

  it('returns undefined when no challenge has a result', () => {
    expect(highestChallengeWithResult(challenges, {})).toBeUndefined()
    expect(highestChallengeWithResult(challenges, { a: undefined })).toBeUndefined()
    expect(highestChallengeWithResult([], { a: 1 })).toBeUndefined()
  })

  it('ignores a result for a challenge that is not in the list', () => {
    expect(highestChallengeWithResult(challenges, { z: 9 })).toBeUndefined()
    expect(highestChallengeWithResult(['a', 'b'], { a: 1, c: 5 })).toEqual({
      challenge: 'a',
      result: 1,
    })
  })

  it('does not treat inherited object keys as results', () => {
    expect(highestChallengeWithResult(['constructor'], {})).toBeUndefined()
  })
})
