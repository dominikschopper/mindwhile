// @vitest-environment happy-dom
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import LevelPicker from './LevelPicker.vue'

const levels = [
  { id: 'a', label: 'Level a', best: '12 moves' },
  { id: 'b', label: 'Level b' },
  { id: 'c', label: 'Level c' },
]

function make(modelValue = 'b', slots = {}) {
  return mount(LevelPicker, { props: { modelValue, levels, legend: 'Choose level' }, slots })
}

describe('LevelPicker', () => {
  it('renders radios in ascending DOM order with exactly one checked', () => {
    const wrapper = make('b')
    const radios = wrapper.findAll('input[type="radio"]')
    expect(radios.map((r) => (r.element as HTMLInputElement).value)).toEqual(['a', 'b', 'c'])
    const checked = radios.filter((r) => (r.element as HTMLInputElement).checked)
    expect(checked).toHaveLength(1)
    expect((checked[0]!.element as HTMLInputElement).value).toBe('b')
  })

  it('shares one name between all radios', () => {
    const names = make()
      .findAll('input')
      .map((r) => r.attributes('name'))
    expect(new Set(names).size).toBe(1)
    expect(names[0]).toBeTruthy()
  })

  it('emits update:modelValue when another step is chosen', async () => {
    const wrapper = make('b')
    await wrapper.findAll('input')[2]!.setValue(true)
    expect(wrapper.emitted('update:modelValue')).toEqual([['c']])
  })

  it('renders the step slot per level with selected set', () => {
    const wrapper = make('b', {
      step: `<template #step="{ level, selected }"><i class="x">{{ level }}:{{ selected }}</i></template>`,
    })
    expect(wrapper.findAll('.x').map((x) => x.text())).toEqual(['a:false', 'b:true', 'c:false'])
  })

  it('renders the best line only when given', () => {
    const wrapper = make()
    const best = wrapper.findAll('.level-picker-best')
    expect(best).toHaveLength(1)
    expect(best[0]!.text()).toBe('12 moves')
  })

  it('has a visually hidden legend', () => {
    const legend = make().find('legend')
    expect(legend.text()).toBe('Choose level')
    expect(legend.classes()).toContain('visually-hidden')
  })

  it('labels each radio and reverses the visual order by CSS', () => {
    const wrapper = make()
    for (const label of wrapper.findAll('label')) {
      expect(wrapper.find(`#${CSS.escape(label.attributes('for')!)}`).exists()).toBe(true)
    }
    const sfc = readFileSync(join(import.meta.dirname, 'LevelPicker.vue'), 'utf8')
    expect(sfc).toContain('column-reverse')
  })

  it('derives the highlight row from the visual position of the selected level', async () => {
    const wrapper = make('a')
    const steps = () => wrapper.find('.level-picker-steps').attributes('style')
    expect(steps()).toContain('--selected-row: 2')
    expect(steps()).toContain('--level-count: 3')
    await wrapper.setProps({ modelValue: 'b' })
    expect(steps()).toContain('--selected-row: 1')
    await wrapper.setProps({ modelValue: 'c' })
    expect(steps()).toContain('--selected-row: 0')
    expect(wrapper.findAll('.level-picker-item').map((i) => i.attributes('style'))).toEqual([
      '--row: 2;',
      '--row: 1;',
      '--row: 0;',
    ])
  })

  it('keeps radio semantics after selecting the second level', async () => {
    const wrapper = make('a')
    await wrapper.setProps({ modelValue: 'b' })
    const radios = wrapper.findAll('input[type="radio"]')
    expect(radios).toHaveLength(3)
    expect(radios.map((r) => (r.element as HTMLInputElement).checked)).toEqual([false, true, false])
    expect(wrapper.findAll('.level-picker-item.selected')).toHaveLength(1)
  })

  it('disables transitions under prefers-reduced-motion', () => {
    const sfc = readFileSync(join(import.meta.dirname, 'LevelPicker.vue'), 'utf8')
    const block = sfc.slice(sfc.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(block).toContain('transition: none')
  })

  it('declares --level-width where --level-count is set', () => {
    // A var() inside a custom property is resolved on the element that declares it.
    // On the fieldset --level-count does not exist, the width would be invalid and
    // the highlight slab would collapse to zero width.
    const sfc = readFileSync(join(import.meta.dirname, 'LevelPicker.vue'), 'utf8')
    const rule = (selector: string) =>
      sfc.slice(sfc.indexOf(`${selector} {`), sfc.indexOf('}', sfc.indexOf(`${selector} {`)))
    expect(rule('.level-picker-steps')).toContain('--level-width')
    expect(rule('.level-picker')).not.toContain('--level-width')
  })

  it('sizes the steps by margins, not by a percentage width', () => {
    // A percentage width breaks when a parent sizes the picker by its content: the slab
    // and the text would no longer line up.
    const sfc = readFileSync(join(import.meta.dirname, 'LevelPicker.vue'), 'utf8')
    const start = sfc.indexOf('.level-picker-item {')
    const rule = sfc.slice(start, sfc.indexOf('}', start))
    expect(rule).not.toMatch(/^\s*width\s*:/m)
    expect(rule).toContain('margin-right')
  })
})
