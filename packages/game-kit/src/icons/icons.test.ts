// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import * as icons from './index'

const { gameSymbols, ...iconComponents } = icons
const entries = Object.entries(iconComponents).filter(([name]) => name.startsWith('Icon'))

describe('icons', () => {
  it('exports the expected number of icons', () => {
    expect(entries).toHaveLength(21)
  })

  it.each(entries)('%s renders a decorative svg', (_name, component) => {
    const svg = mount(component).find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('aria-hidden')).toBe('true')
  })

  it.each(entries)('%s is not aria-hidden when labelled', (_name, component) => {
    const svg = mount(component, { attrs: { 'aria-label': 'label' } }).find('svg')
    expect(svg.attributes('aria-label')).toBe('label')
    expect(svg.attributes('aria-hidden')).toBeUndefined()
  })
})

describe('gameSymbols', () => {
  it.each(Object.entries(gameSymbols))('%s is a component that renders', (_name, component) => {
    expect(mount(component).find('svg').exists()).toBe(true)
  })
})
