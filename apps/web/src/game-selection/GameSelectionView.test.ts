// @vitest-environment happy-dom
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

  it('shows one tile for Spillit with symbol, name and no result', () => {
    const wrapper = mountView()
    const tiles = wrapper.findAll('a')
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
