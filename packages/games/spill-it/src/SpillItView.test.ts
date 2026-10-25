// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { challengeParams } from './challenges'
import { greedyMoves } from './par'
import { createRound } from './round'
import SpillItView from './SpillItView.vue'

function setup(challenge = 'a', seed = 5) {
  const round = createRound({ challenge, seed })
  const wrapper = mount(SpillItView, { props: { round }, attachTo: document.body })
  return { round, wrapper }
}

function key(k: string, init: KeyboardEventInit = {}) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: k, ...init }))
}

// A color different from the current region color.
function otherColor(round: ReturnType<typeof createRound>) {
  return round.board.cells[0] === 0 ? 1 : 0
}

describe('SpillItView', () => {
  it('renders size x size cells with their mark icons', () => {
    const { round, wrapper } = setup()
    const cells = wrapper.findAll('.cell')
    expect(cells).toHaveLength(36)
    cells.forEach((cell, i) => {
      const color = round.board.cells[i]!
      expect(cell.find('svg').exists()).toBe(true)
      expect(cell.text()).toBe('')
      expect(cell.attributes('data-color')).toBe(String(color))
      expect(cell.classes()).toContain(`cell--${color}`)
      expect(cell.attributes('aria-hidden')).toBe('true')
    })
    wrapper.unmount()
  })

  it('has a board with role img and a label with the size', () => {
    const { wrapper } = setup()
    const board = wrapper.find('.board')
    expect(board.attributes('role')).toBe('img')
    expect(board.attributes('aria-label')).toContain('6 by 6')
    wrapper.unmount()
  })

  it('marks only the top left cell as the origin of every move', () => {
    const wrapper = mount(SpillItView, {
      props: { round: createRound({ challenge: 'a', seed: 5 }) },
    })
    const cells = wrapper.findAll('.cell')
    expect(cells[0]!.classes()).toContain('cell--origin')
    expect(wrapper.findAll('.cell--origin')).toHaveLength(1)
  })

  it('renders one labeled button per color', () => {
    const { wrapper } = setup()
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(challengeParams.a.colors)
    expect(buttons[0]!.attributes('aria-label')).toBe('Orange, infinity')
    expect(buttons[1]!.attributes('aria-label')).toBe('Sky blue, alert')
    buttons.forEach((b) => expect(b.find('svg').exists()).toBe(true))
    expect(buttons[3]!.attributes('aria-label')).toBe('Yellow, plane')
    wrapper.unmount()
  })

  it('updates the counter and disables the new region color on click', async () => {
    const { round, wrapper } = setup()
    const counter = wrapper.find('[aria-live]')
    expect(counter.attributes('aria-live')).toBe('polite')
    expect(counter.text()).toBe('Moves 0')
    const color = otherColor(round)
    await wrapper.findAll('button')[color]!.trigger('click')
    expect(counter.text()).toBe('Moves 1')
    expect(wrapper.findAll('button')[color]!.attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('does nothing when the region color button is clicked', async () => {
    const { round, wrapper } = setup()
    const region = round.board.cells[0]!
    const button = wrapper.findAll('button')[region]!
    expect(button.attributes('disabled')).toBeDefined()
    await button.trigger('click')
    expect(wrapper.find('[aria-live]').text()).toBe('Moves 0')
    expect(round.moves).toHaveLength(0)
    wrapper.unmount()
  })

  it('picks colors with the keys 1 to N and ignores others', async () => {
    const { round, wrapper } = setup()
    const color = otherColor(round)
    key(String(color + 1))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[aria-live]').text()).toBe('Moves 1')
    expect(round.board.cells[0]).toBe(color)

    key('7')
    key('a')
    key('0')
    key(String(((color + 1) % 4) + 1), { ctrlKey: true })
    await wrapper.vm.$nextTick()
    expect(round.moves).toHaveLength(1)
    wrapper.unmount()
  })

  it('shows the solved status and disables all buttons after the solving moves', async () => {
    const { round, wrapper } = setup()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    const moves = greedyMoves(round.startBoard, challengeParams.a.colors)
    for (const color of moves) {
      await wrapper.findAll('button')[color]!.trigger('click')
    }
    expect(wrapper.find('[role="status"]').text()).toBe('Solved!')
    for (const button of wrapper.findAll('button')) {
      expect(button.attributes('disabled')).toBeDefined()
    }
    wrapper.unmount()
  })

  it('does not pick a color for a keydown that stopped propagation before the window', async () => {
    const { round, wrapper } = setup()
    const shield = document.createElement('div')
    shield.addEventListener('keydown', (e) => e.stopPropagation())
    document.body.appendChild(shield)
    shield.dispatchEvent(
      new KeyboardEvent('keydown', { key: String(otherColor(round) + 1), bubbles: true }),
    )
    await wrapper.vm.$nextTick()
    expect(round.moves).toHaveLength(0)
    expect(wrapper.find('[aria-live]').text()).toBe('Moves 0')
    shield.remove()
    wrapper.unmount()
  })

  it('removes the key listener on unmount', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const { round, wrapper } = setup()
    const added = add.mock.calls.find((c) => c[0] === 'keydown')
    expect(added).toBeDefined()
    wrapper.unmount()
    expect(remove).toHaveBeenCalledWith('keydown', added![1])
    key(String(otherColor(round) + 1))
    expect(round.moves).toHaveLength(0)
    add.mockRestore()
    remove.mockRestore()
  })
})
