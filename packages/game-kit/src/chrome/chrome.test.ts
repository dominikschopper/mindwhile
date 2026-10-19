// @vitest-environment happy-dom
/* eslint-disable vue/one-component-per-file -- small host components for test setup */
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import AppFooter from './AppFooter.vue'
import AppHeader from './AppHeader.vue'
import ChromeSlot from './ChromeSlot.vue'
import type { ChromeSlotName } from './types'

const mounted: Array<{ unmount: () => void }> = []
const track = <T extends { unmount: () => void }>(wrapper: T): T => {
  mounted.push(wrapper)
  return wrapper
}

beforeEach(() => {
  document.body.innerHTML = ''
})

afterEach(() => {
  mounted.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.restoreAllMocks()
})

describe.each([
  ['header', AppHeader, 'banner'],
  ['footer', AppFooter, 'contentinfo'],
] as const)('App%s', (bar, component) => {
  it('is a landmark element', () => {
    const wrapper = track(mount(component))
    expect(wrapper.element.tagName.toLowerCase()).toBe(bar)
  })

  it('renders the slots in left, center, right containers', () => {
    const wrapper = track(
      mount(component, {
        slots: { left: 'L', center: 'C', right: 'R' },
      }),
    )
    for (const side of ['left', 'center', 'right']) {
      const el = wrapper.find(`#chrome-${bar}-${side}`)
      expect(el.exists()).toBe(true)
      expect(el.text()).toBe(side[0]?.toUpperCase())
    }
    const ids = wrapper.findAll('[id^="chrome-"]').map((el) => el.attributes('id'))
    expect(ids).toEqual([`chrome-${bar}-left`, `chrome-${bar}-center`, `chrome-${bar}-right`])
  })

  it('uses the content column for the inner row', () => {
    const wrapper = track(mount(component))
    expect(wrapper.find('.content-column').exists()).toBe(true)
  })
})

describe('ChromeSlot', () => {
  const host = (name: { value: ChromeSlotName }, show: { value: boolean }) =>
    defineComponent({
      render: () =>
        show.value
          ? h(ChromeSlot, { name: name.value }, () => h('span', { id: 'x' }, 'content'))
          : null,
    })

  it('shows content in the named target', async () => {
    track(mount(AppFooter, { attachTo: document.body }))
    track(
      mount(ChromeSlot, {
        props: { name: 'footer-center' },
        slots: { default: '<b id="x">hi</b>' },
      }),
    )
    await nextTick()
    expect(document.querySelector('#chrome-footer-center #x')).not.toBeNull()
    expect(document.querySelector('#chrome-footer-left #x')).toBeNull()
  })

  it('moves when the name changes and disappears on unmount', async () => {
    track(mount(AppHeader, { attachTo: document.body }))
    const name = ref<ChromeSlotName>('header-left')
    const show = ref(true)
    const wrapper = track(mount(host(name, show)))
    await nextTick()
    expect(document.querySelector('#chrome-header-left #x')).not.toBeNull()
    name.value = 'header-right'
    await nextTick()
    await nextTick()
    expect(document.querySelector('#chrome-header-left #x')).toBeNull()
    expect(document.querySelector('#chrome-header-right #x')).not.toBeNull()
    wrapper.unmount()
    expect(document.querySelector('#x')).toBeNull()
  })

  it('appears when the target is mounted after the slot (deferred teleport)', async () => {
    const wrapper = track(
      mount(
        defineComponent({
          render: () => [
            h(ChromeSlot, { name: 'footer-right' }, () => h('b', { id: 'x' }, 'late')),
            h(AppFooter),
          ],
        }),
        { attachTo: document.body },
      ),
    )
    await nextTick()
    expect(document.querySelector('#chrome-footer-right #x')).not.toBeNull()
    wrapper.unmount()
  })

  it('renders nothing and does not throw when the target is absent', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = track(
      mount(ChromeSlot, {
        props: { name: 'header-center' },
        slots: { default: '<b id="x">no</b>' },
      }),
    )
    await nextTick()
    expect(document.querySelector('#x')).toBeNull()
    expect(wrapper.html()).not.toContain('<b')
  })
})
