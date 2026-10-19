// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import HowToMore from './HowToMore.vue'

const slot = '<a href="#rules">Rules</a><p>Details</p>'

function mountMore(slots: Record<string, string> = { default: slot }) {
  return mount(HowToMore, {
    props: { moreLabel: 'More', lessLabel: 'Less' },
    slots,
    attachTo: document.body,
  })
}

describe('HowToMore', () => {
  it('is collapsed by default and shows the more label', () => {
    const wrapper = mountMore()
    const button = wrapper.find('button')
    expect(button.text()).toBe('More')
    expect(button.attributes('aria-expanded')).toBe('false')
    const content = wrapper.find('[id]:not(button)')
    expect(content.isVisible()).toBe(false)
    wrapper.unmount()
  })

  it('expands on click and shows the less label', async () => {
    const wrapper = mountMore()
    const button = wrapper.find('button')
    await button.trigger('click')
    expect(button.text()).toBe('Less')
    expect(button.attributes('aria-expanded')).toBe('true')
    const content = wrapper.find(`#${button.attributes('aria-controls')}`)
    expect(content.exists()).toBe(true)
    expect(content.isVisible()).toBe(true)
    expect(content.text()).toContain('Details')
    wrapper.unmount()
  })

  it('collapses again on a second click', async () => {
    const wrapper = mountMore()
    const button = wrapper.find('button')
    await button.trigger('click')
    await button.trigger('click')
    expect(button.text()).toBe('More')
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('[id]:not(button)').isVisible()).toBe(false)
    wrapper.unmount()
  })

  it('uses a native button of type button, so Enter and Space toggle it', () => {
    const wrapper = mountMore()
    const button = wrapper.find('button')
    // Enter and Space on a native button fire a click event in the browser.
    expect(button.element.tagName).toBe('BUTTON')
    expect(button.attributes('type')).toBe('button')
    wrapper.unmount()
  })

  it('keeps links and buttons of the hidden content out of the tab order', () => {
    const wrapper = mountMore()
    const content = wrapper.find('[id]:not(button)')
    expect(content.isVisible()).toBe(false)
    expect(content.find('a').isVisible()).toBe(false)
    wrapper.unmount()
  })

  it('renders nothing without slot content', () => {
    const wrapper = mountMore({})
    expect(wrapper.find('button').exists()).toBe(false)
    wrapper.unmount()
  })

  it('takes the labels from the props', () => {
    const wrapper = mount(HowToMore, {
      props: { moreLabel: 'Mehr', lessLabel: 'Weniger' },
      slots: { default: '<p>Details</p>' },
    })
    const button = wrapper.find('button')
    expect(button.text()).toBe('Mehr')
    return button.trigger('click').then(() => {
      expect(button.text()).toBe('Weniger')
    })
  })
})
