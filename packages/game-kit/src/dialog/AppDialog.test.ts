// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { join } from 'node:path'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AppDialog from './AppDialog.vue'

type Exposed = { open(): Promise<void>; close(): void }
let showModal: ReturnType<typeof vi.fn>
let close: ReturnType<typeof vi.fn>

beforeEach(() => {
  showModal = vi.fn()
  close = vi.fn()
  HTMLDialogElement.prototype.showModal = showModal as () => void
  HTMLDialogElement.prototype.close = close as () => void
})

afterEach(() => {
  document.body.innerHTML = ''
})

function make(props: Record<string, unknown> = {}) {
  return mount(AppDialog, {
    props: { heading: 'Title', ...props },
    slots: { default: '<p class="body">Body</p>', actions: '<button class="act">Go</button>' },
  })
}

describe('AppDialog', () => {
  it('calls showModal on open()', async () => {
    const wrapper = make()
    await (wrapper.vm as unknown as Exposed).open()
    expect(showModal).toHaveBeenCalledTimes(1)
  })

  it('emits close once on Escape and closes the dialog', async () => {
    const wrapper = make()
    await wrapper.get('dialog').trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('emits close once on the native cancel event', async () => {
    const wrapper = make()
    await wrapper.get('dialog').trigger('cancel')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('does not emit close from the exposed close()', () => {
    const wrapper = make()
    ;(wrapper.vm as unknown as Exposed).close()
    expect(close).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('keeps keydown away from window', async () => {
    const wrapper = make()
    const onWindow = vi.fn()
    window.addEventListener('keydown', onWindow)
    wrapper.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
    window.removeEventListener('keydown', onWindow)
    expect(onWindow).not.toHaveBeenCalled()
  })

  it('links the heading with aria-labelledby', () => {
    const wrapper = make()
    const id = wrapper.get('dialog').attributes('aria-labelledby')!
    expect(id).toBeTruthy()
    const heading = wrapper.get(`#${CSS.escape(id)}`)
    expect(heading.element.tagName).toBe('H2')
    expect(heading.text()).toBe('Title')
  })

  it('renders both slots', () => {
    const wrapper = make()
    expect(wrapper.get('.body').text()).toBe('Body')
    expect(wrapper.get('.act').text()).toBe('Go')
  })

  it('sets the opaque class only for the opaque variant', () => {
    expect(make().get('dialog').classes()).not.toContain('app-dialog-opaque')
    expect(make({ backdrop: 'opaque' }).get('dialog').classes()).toContain('app-dialog-opaque')
  })

  it('returns focus to the opener after closing', async () => {
    const button = document.createElement('button')
    document.body.append(button)
    button.focus()
    const wrapper = make()
    await (wrapper.vm as unknown as Exposed).open()
    document.body.focus()
    await wrapper.get('dialog').trigger('cancel')
    expect(document.activeElement).toBe(button)
  })

  it('turns the rainbow animation off with reduced motion', () => {
    const css = readFileSync(join(import.meta.dirname, 'AppDialog.vue'), 'utf8')
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[^}]*\{[^}]*::backdrop[^}]*animation: none/,
    )
  })
})
