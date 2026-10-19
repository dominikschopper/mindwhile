// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { formatScore } from './format-score'
import HowToPlay from './HowToPlay.vue'
import { marks } from './marks'
import { gameModule } from './module'
import { createRound } from './round'
import { t } from './texts'

describe('gameModule', () => {
  it('has the manifest and the round factory from round.ts', () => {
    expect(gameModule.manifest.id).toBe('spill-it')
    expect(gameModule.createRound).toBe(createRound)
    expect(gameModule.View).toBeDefined()
    expect(gameModule.HowToPlay).toBe(HowToPlay)
  })

  it('creates a round with apply, serialize and result', () => {
    const round = gameModule.createRound({ challenge: 'a', seed: 1 })
    expect(typeof round.apply).toBe('function')
    expect(typeof round.serialize).toBe('function')
    expect(typeof round.result).toBe('function')
  })

  it('exports formatScore', async () => {
    const mod = await import('./module')
    expect(mod.formatScore).toBe(formatScore)
  })
})

describe('HowToPlay', () => {
  it('shows the headings and the example board marks', () => {
    const wrapper = mount(HowToPlay)
    const headings = wrapper.findAll('h2').map((h) => h.text())
    expect(headings).toEqual([
      t('howTo.rules.heading'),
      t('howTo.example.heading'),
      t('howTo.counter.heading'),
      t('howTo.score.heading'),
      t('howTo.marks.heading'),
    ])
    const boards = wrapper.findAll('.example-board')
    expect(boards).toHaveLength(2)
    const cells = boards[0]!.findAll('.example-cell').map((c) => c.text())
    expect(cells).toEqual([0, 1, 1, 2, 0, 1, 2, 2, 0].map((c) => marks[c]))
    const afterCells = boards[1]!.findAll('.example-cell').map((c) => c.text())
    expect(afterCells).toEqual([1, 1, 1, 2, 0, 1, 2, 2, 0].map((c) => marks[c]))
  })
})
