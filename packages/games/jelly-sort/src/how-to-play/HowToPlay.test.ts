// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { isSolved } from '../common/board/board';
import WonDemo from './WonDemo.vue';

describe('WonDemo', () => {
  it('shows a solved board', () => {
    const wrapper = mount(WonDemo);
    const trays = wrapper
      .findAll('.tray-glass')
      .map((glass) =>
        glass.findAll('.tray-glass__layer').map((layer) => Number(layer.attributes('data-color'))),
      );
    expect(isSolved({ capacity: 4, trays })).toBe(true);
  });
});
