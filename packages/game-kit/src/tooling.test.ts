// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { describe, expect, it } from 'vitest'

// Smoke test for the component test tooling (Vue plugin, happy-dom, test-utils).
const Counter = defineComponent({
  setup() {
    const count = ref(0)
    return () => h('button', { onClick: () => count.value++ }, `count ${count.value}`)
  },
})

describe('component test tooling', () => {
  it('mounts a component and handles a click', async () => {
    const wrapper = mount(Counter)
    expect(wrapper.text()).toBe('count 0')
    await wrapper.trigger('click')
    expect(wrapper.text()).toBe('count 1')
    expect(typeof document).toBe('object')
  })
})
