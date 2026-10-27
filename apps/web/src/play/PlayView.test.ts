// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '../App.vue'
import { dismissNotice } from '../common/composables/use-notice'
import { gameRegistryKey } from '../common/composables/game-registry'
import type { GameRegistry } from '../common/composables/game-registry'
import { createFakeGame } from './fake-game'
import PlayView from './PlayView.vue'

const seeds = vi.hoisted(() => ({ next: [11, 22, 33, 44, 55] as number[] }))

vi.mock('@mindwhile/core', async (importOriginal) => {
  const original = await importOriginal<typeof import('@mindwhile/core')>()
  return { ...original, newSeed: vi.fn(() => seeds.next.shift() ?? 99) }
})

import { newSeed } from '@mindwhile/core'

type Mounted = Awaited<ReturnType<typeof mountAt>>

const mounted: Array<{ unmount(): void }> = []

async function mountAt(path: string, registry?: GameRegistry) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'game-selection', component: { template: '<p>selection</p>' } },
      { path: '/games/:id', name: 'game', component: { template: '<p>game page</p>' } },
      { path: '/settings', name: 'settings', component: { template: '<p>settings</p>' } },
      { path: '/play/:gameId/:level', name: 'play', component: PlayView, props: true },
    ],
  })
  await router.push(path)
  await router.isReady()
  const provide = registry ? { [gameRegistryKey as symbol]: registry } : {}
  const wrapper = mount(App, {
    global: { plugins: [router], provide },
    attachTo: document.body,
  })
  // The game module is loaded asynchronously, wait until loading is over.
  await vi.waitFor(() => expect(wrapper.text()).not.toContain('Loading'), { timeout: 10_000 })
  await flushPromises()
  mounted.push(wrapper)
  return { wrapper, router }
}

function mountFake(path = '/play/fake/a', options: Parameters<typeof createFakeGame>[0] = {}) {
  const fake = createFakeGame(options)
  return mountAt(path, fake.registry).then((m) => ({ ...m, fake }))
}

function footer(wrapper: Mounted['wrapper']) {
  return wrapper.get('footer')
}

async function openAbortDialog(wrapper: Mounted['wrapper']) {
  await footer(wrapper).get('button').trigger('click')
  await flushPromises()
}

afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount()
  document.body.innerHTML = ''
})

beforeEach(() => {
  seeds.next = [11, 22, 33, 44, 55]
  vi.mocked(newSeed).mockClear()
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
})

describe('PlayView with a fake game', () => {
  it('starts a round with the first seed and shows the running chrome', async () => {
    const { wrapper, fake } = await mountFake()
    expect(fake.rounds).toHaveLength(1)
    expect(fake.rounds[0]!.seed).toBe(11)
    expect(wrapper.find('.fake-win').exists()).toBe(true)
    expect(wrapper.find('.result').exists()).toBe(false)
    expect(footer(wrapper).find('button').text()).toContain('Abort')
    expect(footer(wrapper).text()).not.toContain('Back to games')
  })

  it('shows the result panel and the ended footer after a win', async () => {
    const { wrapper } = await mountFake()
    await wrapper.get('.fake-win').trigger('click')
    const panel = wrapper.get('.result')
    expect(panel.text()).toContain('100 fake points')
    expect(footer(wrapper).find('button').exists()).toBe(false)
    expect(footer(wrapper).get('a').text()).toBe('Back to games')
    expect(footer(wrapper).get('a').attributes('href')).toBe('/')
  })

  it('starts a new round with a new seed on Next round', async () => {
    const { wrapper, fake } = await mountFake()
    expect(newSeed).toHaveBeenCalledTimes(1)
    await wrapper.get('.fake-win').trigger('click')
    const next = wrapper.findAll('.result button').find((b) => b.text() === 'Next round')!
    await next.trigger('click')
    expect(newSeed).toHaveBeenCalledTimes(2)
    expect(fake.rounds.map((r) => r.seed)).toEqual([11, 22])
    expect(wrapper.find('.result').exists()).toBe(false)
    expect(footer(wrapper).get('button').text()).toContain('Abort')
  })

  it('keeps playing when the abort dialog is cancelled or closed with Escape', async () => {
    const { wrapper, router } = await mountFake()
    const dialog = wrapper.get('dialog')
    expect(dialog.attributes('open')).toBeUndefined()
    await openAbortDialog(wrapper)
    expect(dialog.attributes('open')).toBeDefined()
    expect(dialog.text()).toContain('Abort round?')
    await wrapper
      .findAll('dialog button')
      .find((b) => b.text() === 'Keep playing')!
      .trigger('click')
    expect(dialog.attributes('open')).toBeUndefined()
    await openAbortDialog(wrapper)
    expect(dialog.attributes('open')).toBeDefined()
    // Escape closes a modal dialog natively, happy-dom does not: emulate it.
    await dialog.trigger('keydown', { key: 'Escape' })
    expect(dialog.attributes('open')).toBeUndefined()
    expect(router.currentRoute.value.path).toBe('/play/fake/a')
    expect(wrapper.find('.fake-win').exists()).toBe(true)
    expect(footer(wrapper).find('button').exists()).toBe(true)
  })

  it('aborts the round, goes to the game page and leaves no result', async () => {
    const { wrapper, router } = await mountFake()
    await openAbortDialog(wrapper)
    await wrapper
      .findAll('dialog button')
      .find((b) => b.text() === 'Abort round')!
      .trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/games/fake')
    expect(wrapper.find('.result').exists()).toBe(false)
    expect(footer(wrapper).find('button').exists()).toBe(false)
    expect(footer(wrapper).get('a').text()).toBe('Back to games')
  })

  it.each(['/play/fake/zzz', '/play/nope/a'])('shows an error and a link for %s', async (path) => {
    const { wrapper, fake } = await mountFake(path)
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.find('[role="alert"] a').attributes('href')).toBe('/')
    expect(wrapper.find('.fake-win').exists()).toBe(false)
    expect(fake.rounds).toHaveLength(0)
  })
})

describe('leave guard', () => {
  const dialogOf = (w: Mounted['wrapper']) => w.find('dialog')
  const choose = (w: Mounted['wrapper'], label: string) =>
    w
      .findAll('dialog button')
      .find((b) => b.text() === label)!
      .trigger('click')

  it('asks on a link navigation and keeps playing on cancel', async () => {
    const { wrapper, router } = await mountFake()
    void router.push('/settings')
    await flushPromises()
    expect(dialogOf(wrapper).attributes('open')).toBeDefined()
    await choose(wrapper, 'Keep playing')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/play/fake/a')
    expect(wrapper.find('.fake-win').exists()).toBe(true)
    expect(footer(wrapper).get('button').text()).toContain('Abort')
  })

  it('redirects to the game page on confirm without asking again', async () => {
    const { wrapper, router } = await mountFake()
    const open = vi.spyOn(HTMLDialogElement.prototype, 'showModal')
    void router.push('/settings')
    await flushPromises()
    await choose(wrapper, 'Abort round')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/games/fake')
    expect(open).toHaveBeenCalledTimes(1)
    expect(wrapper.findAll('dialog')).toHaveLength(0)
    expect(footer(wrapper).find('button').exists()).toBe(false)
  })

  it('guards router.back() with a history entry before the round', async () => {
    const { wrapper, router } = await mountFake('/')
    await router.push('/play/fake/a')
    await vi.waitFor(() => expect(wrapper.find('.fake-win').exists()).toBe(true))
    router.back()
    await flushPromises()
    expect(dialogOf(wrapper).attributes('open')).toBeDefined()
    await choose(wrapper, 'Keep playing')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/play/fake/a')
    router.back()
    await flushPromises()
    await choose(wrapper, 'Abort round')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/games/fake')
  })

  it('guards the header link', async () => {
    const { wrapper, router } = await mountFake()
    await wrapper.get('header a').trigger('click')
    await flushPromises()
    expect(dialogOf(wrapper).attributes('open')).toBeDefined()
    await choose(wrapper, 'Keep playing')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/play/fake/a')
    await wrapper.get('header a').trigger('click')
    await flushPromises()
    await choose(wrapper, 'Abort round')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/games/fake')
  })

  it('does not guard after the win', async () => {
    const { wrapper, router } = await mountFake()
    await wrapper.get('.fake-win').trigger('click')
    const open = vi.spyOn(HTMLDialogElement.prototype, 'showModal')
    await router.push('/settings')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/settings')
    expect(open).not.toHaveBeenCalled()
  })

  it('does not guard without a round', async () => {
    const { router } = await mountFake('/play/fake/zzz')
    await router.push('/settings')
    expect(router.currentRoute.value.path).toBe('/settings')
  })

  it('opens one dialog for two quick navigations', async () => {
    const { wrapper, router } = await mountFake()
    const open = vi.spyOn(HTMLDialogElement.prototype, 'showModal')
    void router.push('/settings')
    void router.push('/')
    await flushPromises()
    expect(open).toHaveBeenCalledTimes(1)
    expect(wrapper.findAll('dialog')).toHaveLength(1)
    await choose(wrapper, 'Keep playing')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/play/fake/a')
  })
})

describe('error guard', () => {
  const message = 'Something went wrong, the round was discarded'

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    dismissNotice()
    vi.restoreAllMocks()
  })

  it.each([
    ['createRound throws', { failCreateRound: true }],
    ['the view throws while rendering', { throwInView: true }],
  ])('goes to the start page with a notice when %s', async (_name, options) => {
    const { wrapper, router } = await mountFake('/play/fake/a', options)
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/'))
    await flushPromises()
    expect(wrapper.text()).toContain(message)
    expect(wrapper.find('.result').exists()).toBe(false)
    expect(footer(wrapper).find('button').exists()).toBe(false)
    expect(console.error).toHaveBeenCalled()
    await wrapper.get('button[aria-label="Dismiss notice"]').trigger('click')
    expect(wrapper.text()).not.toContain(message)
  })

  it('shows the notice only once and a later round works', async () => {
    const { wrapper, router } = await mountFake('/play/fake/a', { failFirstRounds: 1 })
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/'))
    await flushPromises()
    expect(wrapper.text()).toContain(message)
    await wrapper.get('button[aria-label="Dismiss notice"]').trigger('click')

    await router.push('/play/fake/a')
    await vi.waitFor(() => expect(wrapper.find('.fake-win').exists()).toBe(true))
    expect(wrapper.text()).not.toContain(message)
    expect(footer(wrapper).find('button').exists()).toBe(true)
  })

  it('treats a failing module load like a game error', async () => {
    const { wrapper, router } = await mountFake('/play/fake/a', { failLoad: true })
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/'))
    await flushPromises()
    expect(wrapper.text()).toContain(message)
    expect(footer(wrapper).find('button').exists()).toBe(false)
  })

  it('keeps the inline error without a notice for an unknown level', async () => {
    const { wrapper } = await mountFake('/play/fake/zzz')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain(message)
  })
})

describe('PlayView with Spillit (smoke)', () => {
  it('reaches the result panel with On par after the greedy moves', async () => {
    // Test-only: the par solver of the game is the oracle for the "On par" assertion.
    // eslint-disable-next-line boundaries/dependencies
    const { greedyMoves } = await import('../../../../packages/games/spill-it/src/par')
    const { wrapper } = await mountAt('/play/spill-it/a')
    const round = wrapper.findComponent({ name: 'SpillItView' }).props('round') as {
      board: never
      colors: number
    }
    for (const color of greedyMoves(round.board, round.colors)) {
      await wrapper.find(`.color-button[data-color="${color}"]`).trigger('click')
    }
    const panel = wrapper.get('.result')
    expect(panel.text()).toContain('500 points')
    expect(panel.text()).toContain('On par')
    expect(footer(wrapper).get('a').text()).toBe('Back to games')
  })
})

describe('platform modals keep keys away from handlers behind them', () => {
  function keySpy() {
    const spy = vi.fn()
    window.addEventListener('keydown', spy)
    return { spy, stop: () => window.removeEventListener('keydown', spy) }
  }

  function press(element: Element, key: string) {
    element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  }

  it('does not let keys leave the open abort dialog', async () => {
    const { wrapper } = await mountFake()
    await openAbortDialog(wrapper)
    const { spy, stop } = keySpy()
    press(wrapper.get('dialog button').element, '2')
    stop()
    expect(spy).not.toHaveBeenCalled()
  })

  it('does not let keys leave the open menu, but lets them through when it is closed', async () => {
    const { wrapper } = await mountFake()
    const menuButton = wrapper.get('button[aria-label="Menu"]')
    const { spy, stop } = keySpy()

    press(menuButton.element, '2')
    expect(spy).toHaveBeenCalledTimes(1)

    await menuButton.trigger('click')
    press(menuButton.element, '2')
    stop()
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('still closes the menu with Escape and returns the focus to its button', async () => {
    const { wrapper } = await mountFake()
    const menuButton = wrapper.get('button[aria-label="Menu"]')
    await menuButton.trigger('click')
    expect(menuButton.attributes('aria-expanded')).toBe('true')
    press(menuButton.element, 'Escape')
    await flushPromises()
    expect(menuButton.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(menuButton.element)
  })
})
