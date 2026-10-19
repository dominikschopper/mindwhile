// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
// Test-only: the par solver of the game is the oracle for the "On par" assertion.
// eslint-disable-next-line boundaries/dependencies
import { greedyMoves } from '../../../../packages/games/spill-it/src/par'
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
      { path: '/play/:gameId/:challenge', name: 'play', component: PlayView, props: true },
    ],
  })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(PlayView, {
    props: { gameId: path.split('/')[2]!, challenge: path.split('/')[3]! },
    global: { plugins: [router] },
    attachTo: document.body,
  })
  // The game module is a lazy chunk, wait until loading is over.
  await vi.waitFor(() => expect(wrapper.text()).not.toContain('Loading'), { timeout: 10_000 })
  await flushPromises()
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

async function playGreedy(wrapper: Awaited<ReturnType<typeof mountAt>>['wrapper']) {
  const round = gameRound(wrapper)
  const moves = greedyMoves(round.board as never, round.colors)
  for (const color of moves) {
    await wrapper.find(`.color-button[data-color="${color}"]`).trigger('click')
  }
}

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

  it('navigates back to the selection', async () => {
    const { wrapper, router } = await mountAt('/play/spill-it/a')
    await playGreedy(wrapper)
    const back = wrapper.findAll('.result button').find((b) => b.text() === 'Back')!
    await back.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/')
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

  it('opens the help dialog and closes it with Escape', async () => {
    const { wrapper } = await mountAt('/play/spill-it/a')
    const dialog = wrapper.find('dialog')
    expect(dialog.attributes('open')).toBeUndefined()
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'How to play')!
      .trigger('click')
    await flushPromises()
    expect(dialog.attributes('open')).toBeDefined()
    // Escape closes a modal dialog natively, happy-dom does not: emulate the cancel/close.
    await dialog.trigger('keydown', { key: 'Escape' })
    expect(dialog.attributes('open')).toBeUndefined()
  })
})
