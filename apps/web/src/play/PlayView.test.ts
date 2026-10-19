// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
// Test-only: the par solver of the game is the oracle for the "On par" assertion.
// eslint-disable-next-line boundaries/dependencies
import { greedyMoves } from '../../../../packages/games/spill-it/src/par'
import App from '../App.vue'
import PlayView from './PlayView.vue'

const seeds = vi.hoisted(() => ({ next: [11, 22, 33, 44, 55] as number[] }))

vi.mock('@mindwhile/core', async (importOriginal) => {
  const original = await importOriginal<typeof import('@mindwhile/core')>()
  return { ...original, newSeed: vi.fn(() => seeds.next.shift() ?? 99) }
})

import { newSeed } from '@mindwhile/core'

async function mountAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'game-selection', component: { template: '<p>selection</p>' } },
      { path: '/games/:id', name: 'game', component: { template: '<p>game page</p>' } },
      { path: '/play/:gameId/:challenge', name: 'play', component: PlayView, props: true },
    ],
  })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(App, {
    global: { plugins: [router] },
    attachTo: document.body,
  })
  // The game module is a lazy chunk, wait until loading is over.
  await vi.waitFor(() => expect(wrapper.text()).not.toContain('Loading'), { timeout: 10_000 })
  await flushPromises()
  mounted.push(wrapper)
  return { wrapper, router }
}

function gameRound(wrapper: Awaited<ReturnType<typeof mountAt>>['wrapper']) {
  const view = wrapper.findComponent({ name: 'SpillItView' })
  return view.props('round') as {
    board: { cells: number[] }
    colors: number
    par: number
    moves: number[]
  }
}

function footer(wrapper: Awaited<ReturnType<typeof mountAt>>['wrapper']) {
  return wrapper.get('footer')
}

async function playGreedy(wrapper: Awaited<ReturnType<typeof mountAt>>['wrapper']) {
  const round = gameRound(wrapper)
  const moves = greedyMoves(round.board as never, round.colors)
  for (const color of moves) {
    await wrapper.find(`.color-button[data-color="${color}"]`).trigger('click')
  }
}

const mounted: Array<{ unmount(): void }> = []

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

describe('PlayView', () => {
  it('shows a 6x6 board, counter 0, par and four color buttons for challenge a', async () => {
    const { wrapper } = await mountAt('/play/spill-it/a')
    expect(wrapper.findAll('.cell')).toHaveLength(36)
    expect(wrapper.find('.spill-it-moves').text()).toContain('0')
    expect(wrapper.find('.spill-it-par').text()).toContain(String(gameRound(wrapper).par))
    expect(wrapper.findAll('.color-button')).toHaveLength(4)
    expect(wrapper.find('.result').exists()).toBe(false)
    expect(footer(wrapper).find('button').text()).toContain('Abort')
    expect(footer(wrapper).text()).not.toContain('Back to games')
  })

  it('keeps the round extras readable through the frame', async () => {
    const { wrapper } = await mountAt('/play/spill-it/a')
    const round = gameRound(wrapper)
    expect(round.moves).toHaveLength(0)
    const first = round.board.cells[0]
    const color = first === 0 ? 1 : 0
    await wrapper.find(`.color-button[data-color="${color}"]`).trigger('click')
    expect(round.moves).toEqual([color])
  })

  it('shows the result panel with On par after the greedy moves', async () => {
    const { wrapper } = await mountAt('/play/spill-it/a')
    await playGreedy(wrapper)
    const panel = wrapper.find('.result')
    expect(panel.exists()).toBe(true)
    expect(panel.text()).toContain('500 points')
    expect(panel.text()).toContain('On par')
    expect(footer(wrapper).find('button').exists()).toBe(false)
    expect(footer(wrapper).get('a').text()).toBe('Back to games')
    expect(footer(wrapper).get('a').attributes('href')).toBe('/')
  })

  it('starts a new round with a new seed on Next round', async () => {
    const { wrapper } = await mountAt('/play/spill-it/a')
    expect(newSeed).toHaveBeenCalledTimes(1)
    await playGreedy(wrapper)
    const next = wrapper.findAll('.result button').find((b) => b.text() === 'Next round')!
    await next.trigger('click')
    expect(newSeed).toHaveBeenCalledTimes(2)
    expect(wrapper.find('.result').exists()).toBe(false)
    expect(wrapper.find('.spill-it-moves').text()).toContain('0')
    expect(gameRound(wrapper).moves).toHaveLength(0)
  })

  it('keeps playing when the abort dialog is cancelled or closed with Escape', async () => {
    const { wrapper, router } = await mountAt('/play/spill-it/a')
    const dialog = wrapper.get('dialog')
    expect(dialog.attributes('open')).toBeUndefined()
    await footer(wrapper).get('button').trigger('click')
    await flushPromises()
    expect(dialog.attributes('open')).toBeDefined()
    expect(dialog.text()).toContain('Abort round?')
    await wrapper
      .findAll('dialog button')
      .find((b) => b.text() === 'Keep playing')!
      .trigger('click')
    expect(dialog.attributes('open')).toBeUndefined()
    await footer(wrapper).get('button').trigger('click')
    await flushPromises()
    expect(dialog.attributes('open')).toBeDefined()
    // Escape closes a modal dialog natively, happy-dom does not: emulate it.
    await dialog.trigger('keydown', { key: 'Escape' })
    expect(dialog.attributes('open')).toBeUndefined()
    expect(router.currentRoute.value.path).toBe('/play/spill-it/a')
    expect(wrapper.findAll('.cell')).toHaveLength(36)
    expect(footer(wrapper).find('button').exists()).toBe(true)
  })

  it('aborts the round, goes to the game page and leaves no result', async () => {
    const { wrapper, router } = await mountAt('/play/spill-it/a')
    await footer(wrapper).get('button').trigger('click')
    await flushPromises()
    await wrapper
      .findAll('dialog button')
      .find((b) => b.text() === 'Abort round')!
      .trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/games/spill-it')
    expect(wrapper.find('.result').exists()).toBe(false)
    expect(footer(wrapper).find('button').exists()).toBe(false)
    expect(footer(wrapper).get('a').text()).toBe('Back to games')
  })

  it.each(['/play/spill-it/zzz', '/play/nope/a'])(
    'shows an error and a link for %s',
    async (path) => {
      const { wrapper } = await mountAt(path)
      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
      expect(wrapper.find('[role="alert"] a').attributes('href')).toBe('/')
      expect(wrapper.find('.board').exists()).toBe(false)
    },
  )
})
