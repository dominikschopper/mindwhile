import { playMoves } from '@mindwhile/core'
import { describe, expect, it } from 'vitest'
import { createRound } from './round'
import { greedyMoves } from './par'
import { challengeParams } from './challenges'

const pick = (color: number) => ({ type: 'pick', color })

// Seed 0 of challenge a: greedy par is 8, this 7-move sequence is shorter (found by search).
const shorterThanPar = [3, 2, 1, 0, 1, 3, 2]

describe('createRound', () => {
  it('has no result before the board is solved', () => {
    expect(createRound({ challenge: 'a', seed: 0 }).result()).toBeNull()
  })

  it('scores 0 when the greedy sequence is played', () => {
    const round = createRound({ challenge: 'a', seed: 5 })
    const moves = greedyMoves(round.startBoard, challengeParams.a.colors).map(pick)
    expect(playMoves(round, moves)).toEqual({ roundEnd: 'won', score: [500, 0] })
  })

  it('scores negative for a sequence shorter than par', () => {
    const round = createRound({ challenge: 'a', seed: 0 })
    expect(round.par).toBe(8)
    expect(playMoves(round, shorterThanPar.map(pick))).toEqual({
      roundEnd: 'won',
      score: [570, -1],
    })
  })

  it('gives the same round twice for the same seed', () => {
    const a = createRound({ challenge: 'b', seed: 99 })
    const b = createRound({ challenge: 'b', seed: 99 })
    expect(a.startBoard).toEqual(b.startBoard)
    expect(a.par).toBe(b.par)
  })

  it('restores board, moves and result from the serialized state', () => {
    const round = createRound({ challenge: 'a', seed: 3 })
    const moves = greedyMoves(round.startBoard, 4)
    round.apply(pick(moves[0]!))
    round.apply(pick(moves[1]!))
    const restored = createRound({ challenge: 'a', seed: 3, saved: round.serialize() })
    expect(restored.board).toEqual(round.board)
    expect(restored.moves).toEqual(round.moves)
    for (const color of moves.slice(2)) restored.apply(pick(color))
    expect(restored.result()).toEqual({ roundEnd: 'won', score: [500, 0] })
  })
})

describe('apply', () => {
  it('ignores the color the region already has and does not count it', () => {
    const round = createRound({ challenge: 'a', seed: 0 })
    const before = round.board
    round.apply(pick(before.cells[0]!))
    expect(round.board).toEqual(before)
    expect(round.moves).toEqual([])
  })

  it('records the moves in order', () => {
    const round = createRound({ challenge: 'a', seed: 0 })
    for (const color of shorterThanPar.slice(0, 3)) round.apply(pick(color))
    expect(round.moves).toEqual(shorterThanPar.slice(0, 3))
  })

  it('ignores moves after the board is solved', () => {
    const round = createRound({ challenge: 'a', seed: 0 })
    playMoves(round, shorterThanPar.map(pick))
    round.apply(pick(0))
    expect(round.moves).toHaveLength(shorterThanPar.length)
  })

  it.each([
    ['unknown color', { type: 'pick', color: 4 }],
    ['negative color', { type: 'pick', color: -1 }],
    ['fractional color', { type: 'pick', color: 1.5 }],
    ['wrong type', { type: 'end', color: 1 }],
    ['not an object', 'x'],
    ['null', null],
  ])('throws for %s', (_name, move) => {
    expect(() => createRound({ challenge: 'a', seed: 0 }).apply(move)).toThrow()
  })
})

describe('invalid input', () => {
  it('rejects an unknown challenge', () => {
    expect(() => createRound({ challenge: 'z', seed: 0 })).toThrow()
  })

  it.each([
    ['no object', 'x'],
    ['no moves array', {}],
    ['bad color', { moves: [9] }],
  ])('rejects a saved state with %s', (_name, saved) => {
    expect(() => createRound({ challenge: 'a', seed: 0, saved })).toThrow()
  })
})

describe('createRound size and colors', () => {
  it('exposes size and colors of the challenge', () => {
    for (const challenge of ['a', 'b', 'c'] as const) {
      const round = createRound({ challenge, seed: 1 })
      expect(round.size).toBe(challengeParams[challenge].size)
      expect(round.colors).toBe(challengeParams[challenge].colors)
    }
  })
})
