// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { dismissNotice, showNotice } from '../composables/use-notice'
import NoticeBar from './NoticeBar.vue'

describe('NoticeBar', () => {
  afterEach(() => {
    dismissNotice()
    document.body.innerHTML = ''
  })

  it('renders nothing without a notice', () => {
    const wrapper = mount(NoticeBar, { attachTo: document.body })
    expect(wrapper.html()).toBe('<!--v-if-->')
    wrapper.unmount()
  })

  it('renders the notice text in a role="alert" element', async () => {
    const wrapper = mount(NoticeBar, { attachTo: document.body })
    showNotice('Something went wrong, the round was discarded')
    await nextTick()
    const alert = wrapper.get('[role="alert"]')
    expect(alert.text()).toContain('Something went wrong, the round was discarded')
    wrapper.unmount()
  })

  it('shows a newer notice in place of the older one', async () => {
    const wrapper = mount(NoticeBar, { attachTo: document.body })
    showNotice('first')
    await nextTick()
    showNotice('second')
    await nextTick()
    expect(wrapper.findAll('[role="alert"]')).toHaveLength(1)
    expect(wrapper.get('[role="alert"]').text()).toContain('second')
    expect(wrapper.text()).not.toContain('first')
    wrapper.unmount()
  })

  it('dismisses the notice with a keyboard-reachable button', async () => {
    const wrapper = mount(NoticeBar, { attachTo: document.body })
    showNotice('something')
    await nextTick()
    const button = wrapper.get('[role="alert"] button')
    expect(button.element.tagName).toBe('BUTTON')
    expect(button.attributes('tabindex')).toBeUndefined()
    expect(button.attributes('aria-label')).toBe('Dismiss notice')
    await button.trigger('click')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
