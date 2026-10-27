import { computed } from 'vue'
import { describe, expect, it } from 'vitest'
import { startRegion } from './flood'
import { greedyMoves } from './par'
import { createRound } from './round'
import { useSpillItRound } from './use-spill-it-round'

describe('useSpillItRound', () => {
  it('has initial values', () => {
    const round = createRound({ level: 'a', seed: 5 })
    const r = useSpillItRound(round)
    expect(r.cells.value).toEqual(round.startBoard.cells)
    expect(r.size).toBe(6)
    expect(r.colorCount).toBe(4)
    expect(r.moveCount.value).toBe(0)
    expect(r.par).toBe(round.par)
    expect(r.regionColor.value).toBe(round.startBoard.cells[0])
    expect(r.regionSize.value).toBeGreaterThanOrEqual(1)
    expect(r.result.value).toBeNull()
    expect(r.solved.value).toBe(false)
  })

  it('updates reactively on pick', () => {
    const round = createRound({ level: 'a', seed: 5 })
    const r = useSpillItRound(round)
    const snapshot = computed(() => [
      r.cells.value.join(''),
      r.moveCount.value,
      r.regionColor.value,
    ])
    const before = snapshot.value
    const color = (r.regionColor.value + 1) % r.colorCount
    const sizeBefore = r.regionSize.value
    r.pick(color)
    expect(snapshot.value).not.toEqual(before)
    expect(r.moveCount.value).toBe(1)
    expect(r.regionColor.value).toBe(color)
    expect(r.regionSize.value).toBeGreaterThanOrEqual(sizeBefore)
  })

  it('ignores the region color', () => {
    const r = useSpillItRound(createRound({ level: 'a', seed: 5 }))
    const cells = r.cells.value
    r.pick(r.regionColor.value)
    expect(r.moveCount.value).toBe(0)
    expect(r.cells.value).toEqual(cells)
  })

  it('is solved after the greedy moves and ignores later picks', () => {
    const round = createRound({ level: 'a', seed: 5 })
    const r = useSpillItRound(round)
    for (const color of greedyMoves(round.startBoard, r.colorCount)) r.pick(color)
    expect(r.solved.value).toBe(true)
    expect(r.result.value).toEqual({ roundEnd: 'won', score: [500, 0] })
    expect(r.regionSize.value).toBe(36)
    const count = r.moveCount.value
    r.pick((r.regionColor.value + 1) % r.colorCount)
    expect(r.moveCount.value).toBe(count)
  })

  it('shows the same state for a restored round', () => {
    const round = createRound({ level: 'a', seed: 3 })
    const r = useSpillItRound(round)
    for (const color of greedyMoves(round.startBoard, 4).slice(0, 3)) r.pick(color)
    const restored = useSpillItRound(createRound({ level: 'a', seed: 3, saved: round.serialize() }))
    expect(restored.cells.value).toEqual(r.cells.value)
    expect(restored.moveCount.value).toBe(r.moveCount.value)
    expect(restored.regionColor.value).toBe(r.regionColor.value)
    expect(restored.regionSize.value).toBe(r.regionSize.value)
  })

  it('takes the region size from startRegion for several seeds and moves', () => {
    for (const seed of [1, 7, 42]) {
      const round = createRound({ level: 'a', seed })
      const r = useSpillItRound(round)
      expect(r.regionSize.value).toBe(startRegion(round.board).length)
      for (const color of greedyMoves(round.startBoard, r.colorCount).slice(0, 4)) {
        r.pick(color)
        expect(r.regionSize.value).toBe(startRegion(round.board).length)
        expect(r.regionColor.value).toBe(round.board.cells[0])
      }
    }
  })
})
