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
    expect(tile.find('.tile-name').text()).toBe('Spillit')
    expect(tile.text()).not.toContain('spill-it')
    expect(tile.find('.tile-result').text()).toContain('—')
    expect(tile.find('.visually-hidden').text()).toBe('No result yet')
  })

  it('shows the result of the highest challenge with a result', () => {
    vi.spyOn(bestResults, 'useBestResults').mockReturnValue({
      'spill-it': { a: [900, 0], b: [1000, 2] },
    })
    const result = mountView().find('.tile-result')
    expect(result.text()).toContain('1000')
    expect(result.text()).toContain('10×10 · 5 colors')
    expect(result.text()).not.toContain('900')
  })

  it('has no challenge links', () => {
    const wrapper = mountView()
    expect(wrapper.findAll('a').every((a) => !a.attributes('href')?.startsWith('/play/'))).toBe(
      true,
    )
  })
})
