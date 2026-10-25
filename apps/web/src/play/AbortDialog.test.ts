// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import AbortDialog from './AbortDialog.vue'

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
})

describe('AbortDialog', () => {
  it('is named by its heading', () => {
    const wrapper = mount(AbortDialog)
    const dialog = wrapper.get('dialog')
    const id = dialog.attributes('aria-labelledby')!
    expect(id).toBeTruthy()
    expect(wrapper.get(`#${CSS.escape(id)}`).text()).toBe('Abort round?')
  })

  it('opens with open()', async () => {
    const wrapper = mount(AbortDialog)
    expect(wrapper.get('dialog').attributes('open')).toBeUndefined()
    await (wrapper.vm as unknown as { open(): Promise<void> }).open()
    expect(wrapper.get('dialog').attributes('open')).toBeDefined()
  })

  it('emits confirm and cancel from the buttons', async () => {
    const wrapper = mount(AbortDialog)
    await wrapper.get('.abort-confirm').trigger('click')
    expect(wrapper.emitted('confirm')).toHaveLength(1)
    await wrapper.get('.abort-cancel').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('cancels on Escape and keeps keydown inside', async () => {
    const wrapper = mount(AbortDialog)
    await (wrapper.vm as unknown as { open(): Promise<void> }).open()
    await wrapper.get('dialog').trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.get('dialog').attributes('open')).toBeUndefined()
  })
})
