// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { levelParams } from '../common/levels/levels';
import LevelPreview from './LevelPreview.vue';

describe('LevelPreview', () => {
  for (const level of ['a', 'b', 'c'] as const) {
    const { colors, emptyTrays } = levelParams[level];

    it(`renders ${colors + emptyTrays} trays for level ${level}, no text, aria-hidden`, () => {
      const wrapper = mount(LevelPreview, { props: { level } });
      expect(wrapper.findAll('.preview-tray')).toHaveLength(colors + emptyTrays);
      expect(wrapper.findAll('.preview-tray:empty')).toHaveLength(emptyTrays);
      expect(wrapper.attributes('aria-hidden')).toBe('true');
      expect(wrapper.text()).toBe('');
    });

    it(`lays out level ${level} in two rows of the same length`, () => {
      const wrapper = mount(LevelPreview, { props: { level } });
      const columns = (colors + emptyTrays) / 2;
      expect(Number.isInteger(columns)).toBe(true);
      expect(wrapper.attributes('data-columns')).toBe(String(columns));
    });

    it(`is deterministic for level ${level}`, () => {
      expect(mount(LevelPreview, { props: { level } }).html()).toBe(
        mount(LevelPreview, { props: { level } }).html(),
      );
    });
  }
});
