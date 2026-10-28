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
    color: 'green',
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

function previewRegistry(withPreview: boolean): GameRegistry {
  const base = otherEntry()
  const entry: GameEntry = {
    ...base,
    loadModule: async () => ({
      ...(await base.loadModule()),
      ...(withPreview
        ? {
            LevelPreview: ((props: { level: string }) =>
              h('span', { class: 'fake-preview' }, `preview ${props.level}`)) as Component,
          }
        : {}),
    }),
  }
  entry.loadModule = entry.loadModule.bind(entry)
  return { listGames: () => [entry], getGame: (id) => (id === 'other' ? entry : undefined) }
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
  it('shows symbol, name, one radio per level and the first one selected', async () => {
    const { wrapper } = await mountView('spill-it')
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.find('h1').text()).toBe('Spill It!')
    expect(wrapper.find('select').exists()).toBe(false)
    const radios = wrapper.findAll('input[type="radio"]')
    expect(radios).toHaveLength(3)
    expect((radios[0]!.element as HTMLInputElement).checked).toBe(true)
    expect(wrapper.find('.best').text()).toContain('—')
  })

  it('has the game color class of the manifest', async () => {
    const { wrapper } = await mountView('spill-it')
    expect(wrapper.find('.game-page').classes()).toContain('game-color-orange')
  })

  it('shows the points of the best score list of the selected level', async () => {
    vi.spyOn(bestResults, 'useBestResults').mockReturnValue({ 'spill-it': { a: [640, 3] } })
    const { wrapper } = await mountView('spill-it')
    expect(wrapper.find('.best').text()).toContain('640')
    expect(wrapper.find('.best').text()).not.toContain('—')
    expect(wrapper.find('.level-picker-best').text()).toBe('640')
    vi.restoreAllMocks()
  })

  it('updates the best result line when another level is chosen', async () => {
    vi.spyOn(bestResults, 'useBestResults').mockReturnValue({ 'spill-it': { a: [640, 3] } })
    const { wrapper } = await mountView('spill-it')
    await wrapper.findAll('input[type="radio"]')[2]!.setValue(true)
    expect(wrapper.find('.best').text()).toContain('—')
    await wrapper.findAll('input[type="radio"]')[0]!.setValue(true)
    expect(wrapper.find('.best').text()).toContain('640')
    vi.restoreAllMocks()
  })

  it('keeps the selection across navigation and Go uses it', async () => {
    const { wrapper, router } = await mountView('spill-it')
    await wrapper.findAll('input[type="radio"]')[1]!.setValue(true)
    await router.push('/')
    await router.push('/games/spill-it')
    await flushPromises()
    expect((wrapper.findAll('input[type="radio"]')[1]!.element as HTMLInputElement).checked).toBe(
      true,
    )
    await wrapper.find('button.go').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/play/spill-it/b')
  })

  it('renders the level preview after the module is loaded', async () => {
    const registry = previewRegistry(true)
    const router = makeRouter()
    await router.push('/games/other')
    await router.isReady()
    const wrapper = mount(
      { template: '<RouterView />' },
      { global: { plugins: [router], provide: { [gameRegistryKey]: registry } } },
    )
    await flushPromises()
    const previews = wrapper.findAll('.fake-preview').map((p) => p.text())
    expect(previews).toEqual(['preview x', 'preview y'])
    expect(wrapper.find('.game-page').classes()).toContain('game-color-green')
  })

  it('shows no preview for a game without LevelPreview', async () => {
    const registry = previewRegistry(false)
    const router = makeRouter()
    await router.push('/games/other')
    await router.isReady()
    const wrapper = mount(
      { template: '<RouterView />' },
      { global: { plugins: [router], provide: { [gameRegistryKey]: registry } } },
    )
    await flushPromises()
    expect(wrapper.find('.fake-preview').exists()).toBe(false)
    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(2)
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
    expect(wrapper.find('h1').text()).toBe('Spill It!')

    await router.push('/games/other')
    await flushPromises()
    expect(wrapper.find('h1').text()).toBe('Other game')
    const labels = wrapper.findAll('.level-picker-label').map((o) => o.text())
    expect(labels).toEqual(['Other x', 'Other y'])
    expect((wrapper.findAll('input[type="radio"]')[0]!.element as HTMLInputElement).checked).toBe(
      true,
    )
    await vi.waitFor(() => expect(wrapper.text()).toContain('Rules of the other game'))
    expect(wrapper.text()).not.toContain('Loading')
  })

  it('shows an error and a link back for an unknown id', async () => {
    const { wrapper } = await mountView('nope')
    expect(wrapper.text()).toContain('Game not found')
    expect(wrapper.find('a').attributes('href')).toBe('/')
  })
})
