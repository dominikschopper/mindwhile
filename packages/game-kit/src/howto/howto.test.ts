// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import HowToExample from './HowToExample.vue'
import HowToHeading from './HowToHeading.vue'
import HowToParagraph from './HowToParagraph.vue'

describe('HowToHeading', () => {
  it('renders h2 by default', () => {
    const wrapper = mount(HowToHeading, { slots: { default: 'Goal' } })
    expect(wrapper.element.tagName).toBe('H2')
    expect(wrapper.text()).toBe('Goal')
  })

  it('renders h2 for level 2', () => {
    const wrapper = mount(HowToHeading, { props: { level: 2 }, slots: { default: 'Goal' } })
    expect(wrapper.element.tagName).toBe('H2')
  })

  it('renders h3 for level 3', () => {
    const wrapper = mount(HowToHeading, { props: { level: 3 }, slots: { default: 'Goal' } })
    expect(wrapper.element.tagName).toBe('H3')
    expect(wrapper.text()).toBe('Goal')
  })
})

describe('HowToParagraph', () => {
  it('renders the slot inside a p', () => {
    const wrapper = mount(HowToParagraph, { slots: { default: 'Spill the colour.' } })
    expect(wrapper.element.tagName).toBe('P')
    expect(wrapper.text()).toBe('Spill the colour.')
  })
})

describe('HowToExample', () => {
  it('renders the slot in a figure and no caption without a caption prop', () => {
    const wrapper = mount(HowToExample, { slots: { default: '<span class="demo">board</span>' } })
    expect(wrapper.element.tagName).toBe('FIGURE')
    expect(wrapper.find('.demo').exists()).toBe(true)
    expect(wrapper.find('figcaption').exists()).toBe(false)
  })

  it('renders the caption when given', () => {
    const wrapper = mount(HowToExample, {
      props: { caption: 'Two moves solve it' },
      slots: { default: 'board' },
    })
    const caption = wrapper.find('figcaption')
    expect(caption.exists()).toBe(true)
    expect(caption.text()).toBe('Two moves solve it')
  })
})
