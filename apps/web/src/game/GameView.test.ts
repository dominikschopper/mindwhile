// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import GameView from './GameView.vue'

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
      { path: '/play/:gameId/:challenge', component: { template: '<p>play</p>' } },
    ],
  })
}

describe('GameView', () => {
  it('shows symbol, name, challenges and the first one selected', async () => {
    const { wrapper } = await mountView('spill-it')
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.find('h1').text()).toBe('Spillit')
    const options = wrapper.findAll('option')
    expect(options).toHaveLength(3)
    expect(options.map((o) => o.text()).every((text) => text.length > 0)).toBe(true)
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('a')
    expect(wrapper.find('label').text()).toBe('Challenge')
    expect(wrapper.find('.best').text()).toContain('—')
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

  it('shows an error and a link back for an unknown id', async () => {
    const { wrapper } = await mountView('nope')
    expect(wrapper.text()).toContain('Game not found')
    expect(wrapper.find('a').attributes('href')).toBe('/')
  })
})
