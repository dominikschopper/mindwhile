// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useTheme } from '../common/composables/use-theme'
import SettingsView from './SettingsView.vue'

function mountView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/settings', name: 'settings', component: SettingsView }],
  })
  return mount(SettingsView, { global: { plugins: [router] }, attachTo: document.body })
}

function radio(wrapper: ReturnType<typeof mountView>, label: string) {
  const input = wrapper.findAll('input[type="radio"]').find((item) => {
    return item.element.parentElement?.textContent?.trim() === label
  })
  if (!input) throw new Error(`no radio "${label}"`)
  return input
}

function isChecked(wrapper: ReturnType<typeof mountView>, label: string): boolean {
  return (radio(wrapper, label).element as HTMLInputElement).checked
}

describe('SettingsView', () => {
  beforeEach(() => {
    useTheme().setTheme('system')
    document.body.innerHTML = ''
  })

  it('shows three radios with System selected by default', () => {
    const wrapper = mountView()
    const radios = wrapper.findAll('input[type="radio"]')
    expect(radios).toHaveLength(3)
    expect(isChecked(wrapper, 'System')).toBe(true)
    expect(isChecked(wrapper, 'Light')).toBe(false)
    expect(isChecked(wrapper, 'Dark')).toBe(false)
    wrapper.unmount()
  })

  it('labels the radio group by its legend', () => {
    const wrapper = mountView()
    expect(wrapper.get('fieldset legend').text()).toBe('Color scheme')
    expect(wrapper.find('fieldset').findAll('input[type="radio"]')).toHaveLength(3)
    wrapper.unmount()
  })

  it('sets data-theme for light, dark and removes it for system', async () => {
    const wrapper = mountView()
    await radio(wrapper, 'Light').setValue(true)
    expect(document.documentElement.dataset.theme).toBe('light')
    await radio(wrapper, 'Dark').setValue(true)
    expect(document.documentElement.dataset.theme).toBe('dark')
    await radio(wrapper, 'System').setValue(true)
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
    wrapper.unmount()
  })
})
