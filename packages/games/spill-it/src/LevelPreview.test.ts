// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import LevelPreview from './LevelPreview.vue'
import { levelParams } from './levels'

describe('LevelPreview', () => {
  for (const level of ['a', 'b', 'c'] as const) {
    const { size } = levelParams[level]

    it(`renders ${size} x ${size} cells for level ${level}, no text, aria-hidden`, () => {
      const wrapper = mount(LevelPreview, { props: { level } })
      expect(wrapper.findAll('.level-preview > span')).toHaveLength(size * size)
      expect(wrapper.attributes('aria-hidden')).toBe('true')
      expect(wrapper.text()).toBe('')
    })

    it(`is deterministic for level ${level}`, () => {
      const first = mount(LevelPreview, { props: { level } }).html()
      const second = mount(LevelPreview, { props: { level } }).html()
      expect(second).toBe(first)
    })
  }
})
