// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import ThemeSwitch from '../common/components/ThemeSwitch.vue'
import GameSelectionView from './GameSelectionView.vue'

function mountView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: GameSelectionView }],
  })
  return mount(GameSelectionView, { global: { plugins: [router] } })
}

describe('GameSelectionView', () => {
  it('lists Spillit by display name', () => {
    const wrapper = mountView()
    expect(wrapper.text()).toContain('Spillit')
    expect(wrapper.text()).not.toContain('spill-it')
  })

  it('links the three challenges to the play route', () => {
    const links = mountView().findAll('a')
    expect(links.map((link) => link.text())).toEqual([
      '6×6 · 4 colors',
      '10×10 · 5 colors',
      '14×14 · 6 colors',
    ])
    expect(links.map((link) => link.attributes('href'))).toEqual([
      '/play/spill-it/a',
      '/play/spill-it/b',
      '/play/spill-it/c',
    ])
  })

  it('shows the theme switch', () => {
    expect(mountView().findComponent(ThemeSwitch).exists()).toBe(true)
  })
})
