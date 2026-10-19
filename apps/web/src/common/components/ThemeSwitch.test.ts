// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { useTheme } from '../composables/use-theme'
import ThemeSwitch from './ThemeSwitch.vue'

describe('ThemeSwitch', () => {
  beforeEach(() => {
    useTheme().setTheme('system')
  })

  it('shows the current choice and follows the state on click', async () => {
    const wrapper = mount(ThemeSwitch)
    expect(wrapper.text()).toBe('System')
    expect(wrapper.attributes('aria-label')).toBe('Color theme: System')

    await wrapper.trigger('click')
    expect(wrapper.text()).toBe('Light')
    expect(wrapper.attributes('aria-label')).toBe('Color theme: Light')

    await wrapper.trigger('click')
    expect(wrapper.text()).toBe('Dark')
    expect(wrapper.attributes('aria-label')).toBe('Color theme: Dark')

    await wrapper.trigger('click')
    expect(wrapper.text()).toBe('System')
  })
})
