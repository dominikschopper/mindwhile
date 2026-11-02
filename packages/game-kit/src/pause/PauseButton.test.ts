// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import PauseButton from './PauseButton.vue';

describe('PauseButton', () => {
  it('renders a button with the label and a hidden svg icon', () => {
    const wrapper = mount(PauseButton, { props: { label: 'Pause' } });
    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.text()).toBe('Pause');
    expect(wrapper.get('svg').attributes('aria-hidden')).toBe('true');
  });

  it('emits click', async () => {
    const wrapper = mount(PauseButton, { props: { label: 'Pause' } });
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('passes disabled through', () => {
    const wrapper = mount(PauseButton, { props: { label: 'Pause' }, attrs: { disabled: true } });
    expect(wrapper.attributes('disabled')).toBeDefined();
  });
});
