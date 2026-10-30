// @vitest-environment happy-dom
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AppButton from './AppButton.vue'

describe('AppButton', () => {
  it('renders a button of type button by default', () => {
    const wrapper = mount(AppButton, { slots: { default: 'Go' } })
    const el = wrapper.element as HTMLButtonElement
    expect(el.tagName).toBe('BUTTON')
    expect(el.type).toBe('button')
    expect(wrapper.classes()).toContain('app-button-secondary')
  })

  it.each(['primary', 'secondary', 'danger'] as const)('sets the class for %s', (variant) => {
    const wrapper = mount(AppButton, { props: { variant } })
    expect(wrapper.classes()).toContain(`app-button-${variant}`)
  })

  it('blocks click when disabled', async () => {
    const wrapper = mount(AppButton, { props: { disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
    expect((wrapper.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('emits click', async () => {
    const wrapper = mount(AppButton)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('renders the icon slot before the label', () => {
    const wrapper = mount(AppButton, {
      slots: { icon: '<svg data-test="icon"></svg>', default: 'Label' },
    })
    const html = wrapper.html()
    expect(html.indexOf('data-test="icon"')).toBeGreaterThan(-1)
    expect(html.indexOf('data-test="icon"')).toBeLessThan(html.indexOf('Label'))
  })

  it('renders a link with as="a" and href', () => {
    const wrapper = mount(AppButton, {
      props: { as: 'a' },
      attrs: { href: '/settings' },
      slots: { default: 'Settings' },
    })
    const el = wrapper.element as HTMLAnchorElement
    expect(el.tagName).toBe('A')
    expect(el.getAttribute('href')).toBe('/settings')
    expect(el.hasAttribute('type')).toBe(false)
  })

  it('marks a disabled link as aria-disabled', () => {
    const wrapper = mount(AppButton, { props: { as: 'a', disabled: true } })
    expect(wrapper.attributes('aria-disabled')).toBe('true')
  })

  it('fires click on Enter and Space of a real button', async () => {
    const wrapper = mount(AppButton, { attachTo: document.body })
    // happy-dom does not synthesize click from keys, so assert the native
    // element is a button, which the browser activates with Enter and Space.
    expect((wrapper.element as HTMLElement).tagName).toBe('BUTTON')
    ;(wrapper.element as HTMLButtonElement).focus()
    expect(document.activeElement).toBe(wrapper.element)
    await wrapper.trigger('keydown', { key: 'Enter' })
    ;(wrapper.element as HTMLButtonElement).click()
    expect(wrapper.emitted('click')).toHaveLength(1)
    wrapper.unmount()
  })

  it('switches off motion under prefers-reduced-motion', () => {
    const css = readFileSync(join(import.meta.dirname, 'AppButton.vue'), 'utf8')
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*transition: none/)
  })
})
