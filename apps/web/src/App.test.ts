// @vitest-environment happy-dom
import { ChromeSlot } from '@mindwhile/game-kit'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from './App.vue'
import { registerAbortHandler, setRoundState } from './common/composables/use-chrome'

const SlotChild = defineComponent({
  render: () => h(ChromeSlot, { name: 'footer-center' }, () => h('span', { id: 'probe' }, 'probe')),
})

async function setup() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: SlotChild },
      { path: '/settings', component: { template: '<div />' } },
    ],
  })
  await router.push('/')
  const wrapper = mount(App, { global: { plugins: [router] }, attachTo: document.body })
  await wrapper.vm.$nextTick()
  return wrapper
}

describe('App', () => {
  beforeEach(() => {
    setRoundState('idle')
    registerAbortHandler(null)
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders the landmarks and the app name link', async () => {
    const wrapper = await setup()
    expect(wrapper.find('header').exists()).toBe(true)
    expect(wrapper.find('main').exists()).toBe(true)
    expect(wrapper.find('footer').exists()).toBe(true)
    expect(wrapper.get('header a').text()).toBe('Mindwhile')
    expect(wrapper.get('header a').attributes('href')).toBe('/')
    wrapper.unmount()
  })

  it('shows the gamer tag placeholder in the footer', async () => {
    const wrapper = await setup()
    expect(wrapper.get('footer').text()).toContain('Swift Fox')
    expect(wrapper.get('footer .gamer-tag svg').attributes('aria-hidden')).toBe('true')
    wrapper.unmount()
  })

  it('shows "Back to games" when idle or ended', async () => {
    const wrapper = await setup()
    for (const state of ['idle', 'ended'] as const) {
      setRoundState(state)
      await wrapper.vm.$nextTick()
      const link = wrapper.get('footer a')
      expect(link.text()).toBe('Back to games')
      expect(link.attributes('href')).toBe('/')
      expect(wrapper.find('footer button').exists()).toBe(false)
    }
    wrapper.unmount()
  })

  it('shows the abort button while running and calls the handler', async () => {
    const handler = vi.fn()
    registerAbortHandler(handler)
    const wrapper = await setup()
    setRoundState('running')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).not.toContain('Back to games')
    await wrapper.get('footer button').trigger('click')
    expect(handler).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('renders a footer-center ChromeSlot in the footer center', async () => {
    const wrapper = await setup()
    await wrapper.vm.$nextTick()
    const center = document.getElementById('chrome-footer-center')
    expect(center?.querySelector('#probe')).not.toBeNull()
    wrapper.unmount()
  })
})
