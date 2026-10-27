// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { GameManifest, GameModule, GameTexts } from '@mindwhile/core'
import type { Component } from 'vue'
import { defaultGameRegistry, gameRegistryKey } from '../common/composables/game-registry'
import type { GameEntry, GameRegistry } from '../common/composables/game-registry'
import * as bestResults from '../common/composables/use-best-results'
import GameView from './GameView.vue'

function otherEntry(): GameEntry {
  const manifest: GameManifest = {
    id: 'other',
    symbol: 'grid-2x2',
    gameVersion: 1,
    scoringVersion: 1,
    interfaceVersion: 1,
    levels: ['x', 'y'],
    scoring: [{ key: 'points', better: 'higher' }],
  }
  const texts: GameTexts = {
    name: 'Other game',
    levelName: (level) => `Other ${level}`,
    formatScore: (score) => `${score[0]} other points`,
  }
  const gameModule: GameModule<Component> = {
    manifest,
    createRound: () => {
      throw new Error('not used in this test')
    },
    View: () => null,
    HowToPlay: () => h('p', 'Rules of the other game'),
  }
  return { id: 'other', manifest, texts, loadModule: async () => gameModule }
}

function twoGameRegistry(): GameRegistry {
  const games = [defaultGameRegistry.getGame('spill-it')!, otherEntry()]
  return {
    listGames: () => games,
    getGame: (id) => games.find((game) => game.id === id),
  }
}

async function mountView(id: string, router = makeRouter()) {
  await router.push(`/games/${id}`)
  await router.isReady()
  const wrapper = mount({ template: '<RouterView />' }, { global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<p>home</p>' } },
      { path: '/games/:id', component: GameView, props: true },
      { path: '/play/:gameId/:level', component: { template: '<p>play</p>' } },
    ],
  })
}

describe('GameView', () => {
  it('shows symbol, name, levels and the first one selected', async () => {
    const { wrapper } = await mountView('spill-it')
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.find('h1').text()).toBe('Spillit')
    const options = wrapper.findAll('option')
    expect(options).toHaveLength(3)
    expect(options.map((o) => o.text()).every((text) => text.length > 0)).toBe(true)
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('a')
    expect(wrapper.find('label').text()).toBe('Level')
    expect(wrapper.find('.best').text()).toContain('—')
  })

  it('shows the points of the best score list of the selected level', async () => {
    vi.spyOn(bestResults, 'useBestResults').mockReturnValue({ 'spill-it': { a: [640, 3] } })
    const { wrapper } = await mountView('spill-it')
    expect(wrapper.find('.best').text()).toContain('640')
    expect(wrapper.find('.best').text()).not.toContain('—')
    vi.restoreAllMocks()
  })

  it('keeps the selection across navigation and Go uses it', async () => {
    const { wrapper, router } = await mountView('spill-it')
    await wrapper.find('select').setValue('b')
    await router.push('/')
    await router.push('/games/spill-it')
    await flushPromises()
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('b')
    await wrapper.find('button.go').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/play/spill-it/b')
  })

  it('shows the rules heading, goal and hides details until More', async () => {
    const { wrapper } = await mountView('spill-it')
    expect(wrapper.find('h2').text()).toBe('Game rules')
    expect(wrapper.text()).toContain('Loading')
    await vi.waitFor(() => expect(wrapper.text()).not.toContain('Loading'))
    const toggle = wrapper.findAll('button').find((b) => b.text() === 'More')
    expect(toggle).toBeDefined()
    expect(wrapper.find('[aria-expanded="true"]').exists()).toBe(false)
    await toggle!.trigger('click')
    expect(wrapper.findAll('button').some((b) => b.text() === 'Less')).toBe(true)
  })

  it('shows the other game when the route changes to its id', async () => {
    const registry = twoGameRegistry()
    const router = makeRouter()
    await router.push('/games/spill-it')
    await router.isReady()
    const wrapper = mount(
      { template: '<RouterView />' },
      { global: { plugins: [router], provide: { [gameRegistryKey]: registry } } },
    )
    await flushPromises()
    expect(wrapper.find('h1').text()).toBe('Spillit')

    await router.push('/games/other')
    await flushPromises()
    expect(wrapper.find('h1').text()).toBe('Other game')
    const options = wrapper.findAll('option').map((o) => o.text())
    expect(options).toEqual(['Other x', 'Other y'])
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('x')
    await vi.waitFor(() => expect(wrapper.text()).toContain('Rules of the other game'))
    expect(wrapper.text()).not.toContain('Loading')
  })

  it('shows an error and a link back for an unknown id', async () => {
    const { wrapper } = await mountView('nope')
    expect(wrapper.text()).toContain('Game not found')
    expect(wrapper.find('a').attributes('href')).toBe('/')
  })
})
