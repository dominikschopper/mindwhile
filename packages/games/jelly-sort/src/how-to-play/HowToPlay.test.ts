// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isSolved, solvedBoard } from '../common/board/board';
import { en } from '../common/texts/en';
import { LANDING_TIMING } from '../play/animation';
import { DEMO_STEPS } from './demo-loop';
import HowToPlay from './HowToPlay.vue';
import PourDemo from './PourDemo.vue';
import WonDemo from './WonDemo.vue';

function mockMotion(reduce: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query.includes('reduce'),
    media: query,
  }));
  window.matchMedia = globalThis.matchMedia;
}

describe('PourDemo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockMotion(false);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('is hidden from screen readers and not clickable', () => {
    const wrapper = mount(PourDemo);
    expect(wrapper.attributes('aria-hidden')).toBe('true');
    expect(wrapper.findAll('.tray-glass')).toHaveLength(3);
    for (const glass of wrapper.findAll('.tray-glass')) {
      expect(glass.attributes('disabled')).toBeDefined();
    }
    wrapper.unmount();
  });

  it('shows the selected state at the select step and the landing at the pour step', async () => {
    const wrapper = mount(PourDemo);
    await vi.advanceTimersByTimeAsync(0);
    expect(wrapper.find('.tray-glass--selected').exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(DEMO_STEPS[0]!.ms);
    expect(wrapper.findAll('.tray-glass--selected')).toHaveLength(1);
    expect(wrapper.find('.tray-glass__block--lifted').exists()).toBe(true);
    await vi.advanceTimersByTimeAsync(DEMO_STEPS[1]!.ms);
    expect(wrapper.find('.tray-glass--selected').exists()).toBe(false);
    expect(wrapper.find('[data-landing-phase="flow"]').exists()).toBe(true);
    await vi.advanceTimersByTimeAsync(LANDING_TIMING.flow);
    expect(wrapper.find('[data-landing-phase="hover"]').exists()).toBe(true);
    await vi.advanceTimersByTimeAsync(LANDING_TIMING.hover);
    expect(wrapper.find('[data-landing-phase="merge"]').exists()).toBe(true);
    await vi.advanceTimersByTimeAsync(LANDING_TIMING.merge);
    expect(wrapper.find('[data-landing-phase]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('resets to the start board and loops', async () => {
    const wrapper = mount(PourDemo);
    await vi.advanceTimersByTimeAsync(0);
    const startHtml = wrapper.html();
    for (const step of DEMO_STEPS) {
      await vi.advanceTimersByTimeAsync(step.ms);
    }
    expect(wrapper.html()).toBe(startHtml);
    wrapper.unmount();
  });

  it('clears its timers on unmount', async () => {
    const wrapper = mount(PourDemo);
    await vi.advanceTimersByTimeAsync(DEMO_STEPS[0]!.ms + DEMO_STEPS[1]!.ms);
    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('shows two static pictures and starts no timer with reduced motion', () => {
    mockMotion(true);
    const wrapper = mount(PourDemo);
    expect(vi.getTimerCount()).toBe(0);
    expect(wrapper.findAll('.pour-demo__static')).toHaveLength(2);
    expect(wrapper.findAll('.tray-glass')).toHaveLength(6);
    expect(wrapper.find('.tray-glass--selected').exists()).toBe(false);
    wrapper.unmount();
  });
});

describe('WonDemo', () => {
  it('renders three trays in the won state with labels', () => {
    const wrapper = mount(WonDemo);
    const glasses = wrapper.findAll('.tray-glass');
    expect(glasses).toHaveLength(3);
    const trays = glasses.map((glass) =>
      glass.findAll('.tray-glass__layer').map((layer) => Number(layer.attributes('data-color'))),
    );
    expect(isSolved({ capacity: 4, trays })).toBe(true);
    expect(trays.some((tray) => tray.length === 0)).toBe(true);
    expect(solvedBoard(2, 4, 1).trays).toEqual(trays);
    for (const glass of glasses) {
      expect(glass.attributes('aria-label')).toMatch(/^Tray \d/);
    }
  });
});

describe('HowToPlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockMotion(false);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('renders both demos and the texts', () => {
    const wrapper = mount(HowToPlay);
    expect(wrapper.findAll('.tray-glass')).toHaveLength(6);
    expect(wrapper.text()).toContain(en['howTo.goal.caption']);
    expect(wrapper.text()).toContain(en['howTo.score.moves']);
    expect(wrapper.text()).toContain(en['howTo.move.pick']);
    wrapper.unmount();
  });
});
