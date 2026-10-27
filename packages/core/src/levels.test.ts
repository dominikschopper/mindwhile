import { describe, expect, it } from 'vitest'
import { highestLevelWithResult } from './levels'

const levels = ['a', 'b', 'c'] as const

describe('highestLevelWithResult', () => {
  it('picks the last level in manifest order that has a result', () => {
    expect(highestLevelWithResult(levels, { a: 1, b: 2 })).toEqual({
      level: 'b',
      result: 2,
    })
    expect(highestLevelWithResult(levels, { a: 1, b: 2, c: 3 })).toEqual({
      level: 'c',
      result: 3,
    })
  })

  it('skips levels without a result', () => {
    expect(highestLevelWithResult(levels, { a: 7, c: undefined })).toEqual({
      level: 'a',
      result: 7,
    })
    expect(highestLevelWithResult(levels, { a: 7, b: undefined })).toEqual({
      level: 'a',
      result: 7,
    })
  })

  it('returns undefined when no level has a result', () => {
    expect(highestLevelWithResult(levels, {})).toBeUndefined()
    expect(highestLevelWithResult(levels, { a: undefined })).toBeUndefined()
    expect(highestLevelWithResult([], { a: 1 })).toBeUndefined()
  })

  it('ignores a result for a level that is not in the list', () => {
    expect(highestLevelWithResult(levels, { z: 9 })).toBeUndefined()
    expect(highestLevelWithResult(['a', 'b'], { a: 1, c: 5 })).toEqual({
      level: 'a',
      result: 1,
    })
  })

  it('does not treat inherited object keys as results', () => {
    expect(highestLevelWithResult(['constructor'], {})).toBeUndefined()
  })
})
