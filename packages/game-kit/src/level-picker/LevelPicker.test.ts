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
  return mount(LevelPicker, {
    props: { modelValue, levels, legend: 'Choose level', selectedLabel: 'Selected' },
    slots,
  })
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

  it('labels each radio and lays the cards out as a grid', () => {
    const wrapper = make()
    for (const label of wrapper.findAll('label')) {
      expect(wrapper.find(`#${CSS.escape(label.attributes('for')!)}`).exists()).toBe(true)
    }
    const sfc = readFileSync(join(import.meta.dirname, 'LevelPicker.vue'), 'utf8')
    expect(sfc).toContain('grid')
    expect(sfc).toContain('minmax(11rem, 1fr)')
  })

  it('shows the selected mark with the hidden selectedLabel only on the selected card', async () => {
    const wrapper = make('b')
    const marks = wrapper.findAll('.level-picker-mark')
    expect(marks).toHaveLength(1)
    expect(marks[0]!.find('svg').exists()).toBe(true)
    expect(marks[0]!.find('.visually-hidden').text()).toBe('Selected')
    expect(wrapper.findAll('.level-picker-item')[1]!.find('.level-picker-mark').exists()).toBe(true)
    await wrapper.setProps({ modelValue: 'c' })
    expect(wrapper.findAll('.level-picker-item')[2]!.find('.level-picker-mark').exists()).toBe(true)
    expect(wrapper.findAll('.level-picker-mark')).toHaveLength(1)
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
})
