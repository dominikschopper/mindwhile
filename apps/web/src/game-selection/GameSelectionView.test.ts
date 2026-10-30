// @vitest-environment happy-dom
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import * as bestResults from '../common/composables/use-best-results'
import GameSelectionView from './GameSelectionView.vue'

function mountView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: GameSelectionView }],
  })
  return mount(GameSelectionView, { global: { plugins: [router] } })
}

describe('GameSelectionView', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the hero heading and the coming soon block', () => {
    const wrapper = mountView()
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.find('h1').text()).toBe('Welcome to Mindwhile!')
    expect(wrapper.find('.coming-soon h2').text()).toBe('More games are coming')
    expect(wrapper.find('.coming-soon').text()).toContain('new puzzles')
    expect(wrapper.find('.coming-soon a, .coming-soon button, .coming-soon form').exists()).toBe(
      false,
    )
  })

  it('shrinks the hero to the heading in a narrow container', () => {
    // happy-dom has no layout, so the rule itself is checked in the source.
    const sfc = readFileSync(join(__dirname, 'GameSelectionView.vue'), 'utf8')
    expect(sfc).toContain('container-type: inline-size')
    const rule = sfc.slice(sfc.indexOf('@container (max-width: 60ch)'))
    expect(rule).toMatch(/\.hero p\s*\{\s*display:\s*none/)
  })

  it('shows one tile for Spillit with symbol, name and no result', () => {
    const wrapper = mountView()
    const tiles = wrapper.findAll('.tiles a')
    expect(tiles).toHaveLength(1)
    const tile = tiles[0]!
    expect(tile.attributes('href')).toBe('/games/spill-it')
    expect(tile.find('svg').exists()).toBe(true)
    expect(tile.find('.tile-name').text()).toBe('Spill It!')
    expect(tile.text()).not.toContain('spill-it')
    expect(tile.classes()).toContain('game-color-orange')
    expect(tile.find('.pill').exists()).toBe(false)
    expect(tile.find('.visually-hidden').text()).toBe('No result yet')
  })

  it('shows the result of the highest level with a result', () => {
    vi.spyOn(bestResults, 'useBestResults').mockReturnValue({
      'spill-it': { a: [900, 0], b: [1000, 2] },
    })
    const wrapper = mountView()
    expect(wrapper.find('.pill-score').text()).toBe('1000')
    expect(wrapper.find('.pill-level').text()).toContain('10×10 · 5 colors')
    expect(wrapper.text()).not.toContain('900')
  })

  it('has no level links', () => {
    const wrapper = mountView()
    expect(wrapper.findAll('a').every((a) => !a.attributes('href')?.startsWith('/play/'))).toBe(
      true,
    )
  })
})
