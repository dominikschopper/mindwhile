// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { IconSymbolPlaceholder, profileSymbolNames, profileSymbols } from './index';

const spillitMarks = ['infinity', 'circle-alert', 'activity', 'plane', 'sun-moon', 'apple'];

describe('profileSymbols', () => {
  it('has between 22 and 26 symbols', () => {
    expect(profileSymbolNames.length).toBeGreaterThanOrEqual(22);
    expect(profileSymbolNames.length).toBeLessThanOrEqual(26);
  });

  it('lists exactly the keys, unique', () => {
    expect(profileSymbolNames).toEqual(Object.keys(profileSymbols));
    expect(new Set(profileSymbolNames).size).toBe(profileSymbolNames.length);
  });

  it.each(profileSymbolNames)('%s is a valid name', (name) => {
    expect(name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(name.length).toBeLessThanOrEqual(24);
    expect(spillitMarks).not.toContain(name);
  });

  it.each(profileSymbolNames)('%s renders a decorative svg', (name) => {
    const svg = mount(profileSymbols[name]).find('svg');
    expect(svg.exists()).toBe(true);
    expect(svg.attributes('aria-hidden')).toBe('true');
  });

  it('placeholder renders a decorative svg', () => {
    const svg = mount(IconSymbolPlaceholder).find('svg');
    expect(svg.exists()).toBe(true);
    expect(svg.attributes('aria-hidden')).toBe('true');
  });
});
