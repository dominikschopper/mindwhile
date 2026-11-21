// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTheme } from '../composables/use-theme';
import ColorSchemeChoice from './ColorSchemeChoice.vue';

function mountChoice() {
  return mount(ColorSchemeChoice, { attachTo: document.body });
}

function radio(wrapper: ReturnType<typeof mountChoice>, label: string) {
  const input = wrapper.findAll('input[type="radio"]').find((item) => {
    return item.element.parentElement?.textContent?.trim() === label;
  });
  if (!input) {
    throw new Error(`no radio "${label}"`);
  }
  return input;
}

function isChecked(wrapper: ReturnType<typeof mountChoice>, label: string): boolean {
  return (radio(wrapper, label).element as HTMLInputElement).checked;
}

describe('ColorSchemeChoice', () => {
  beforeEach(() => {
    useTheme().setTheme('system');
    document.body.innerHTML = '';
  });

  it('shows three radios with the right labels and System checked by default', () => {
    const wrapper = mountChoice();
    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(3);
    expect(isChecked(wrapper, 'Sys')).toBe(true);
    expect(isChecked(wrapper, 'Light')).toBe(false);
    expect(isChecked(wrapper, 'Dark')).toBe(false);
    wrapper.unmount();
  });

  it('labels the radio group by its legend text', () => {
    const wrapper = mountChoice();
    expect(wrapper.get('[role="radiogroup"]').attributes('aria-labelledby')).toBeTruthy();
    expect(wrapper.get('.color-scheme-legend').text()).toBe('Theme');
    expect(wrapper.get('[role="radiogroup"]').findAll('input[type="radio"]')).toHaveLength(3);
    wrapper.unmount();
  });

  it('checks the radio of the current choice', async () => {
    useTheme().setTheme('dark');
    const wrapper = mountChoice();
    expect(isChecked(wrapper, 'Dark')).toBe(true);
    expect(isChecked(wrapper, 'Sys')).toBe(false);
    wrapper.unmount();
  });

  it('changes the theme and the choice when another radio is selected', async () => {
    const wrapper = mountChoice();
    await radio(wrapper, 'Light').setValue(true);
    expect(useTheme().choice.value).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(isChecked(wrapper, 'Light')).toBe(true);
    await radio(wrapper, 'Sys').setValue(true);
    expect(useTheme().choice.value).toBe('system');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    wrapper.unmount();
  });
});
