// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import MainMenu from './MainMenu.vue'

function makeRouter() {
  const Stub = { template: '<div />' }
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Stub },
      { path: '/settings', component: Stub },
    ],
  })
}

describe('MainMenu', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  async function setup() {
    const router = makeRouter()
    await router.push('/')
    const wrapper = mount(MainMenu, { global: { plugins: [router] }, attachTo: document.body })
    return wrapper
  }

  it('opens and closes by clicking the button', async () => {
    const wrapper = await setup()
    const button = wrapper.get('button[aria-label="Menu"]')
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(button.attributes('aria-controls')).toBe('main-menu-list')
    expect(wrapper.get('#main-menu-list').isVisible()).toBe(false)
    await button.trigger('click')
    expect(button.attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('#main-menu-list').isVisible()).toBe(true)
    await button.trigger('click')
    expect(button.attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })

  it('closes on Escape and returns focus to the button', async () => {
    const wrapper = await setup()
    const button = wrapper.get('button[aria-label="Menu"]')
    await button.trigger('click')
    await wrapper.get('a').trigger('keydown', { key: 'Escape' })
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(button.element)
    wrapper.unmount()
  })

  it('closes on outside click', async () => {
    const wrapper = await setup()
    const button = wrapper.get('button[aria-label="Menu"]')
    await button.trigger('click')
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(button.attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })

  it('closes when the settings entry is activated', async () => {
    const wrapper = await setup()
    const button = wrapper.get('button[aria-label="Menu"]')
    await button.trigger('click')
    const link = wrapper.get('a')
    expect(link.attributes('href')).toBe('/settings')
    await link.trigger('click')
    expect(button.attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })

  it('has a disabled language entry', async () => {
    const wrapper = await setup()
    await wrapper.get('button[aria-label="Menu"]').trigger('click')
    const language = wrapper.get('#main-menu-list button')
    expect(language.text()).toBe('Language: English')
    expect(language.attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })
})
