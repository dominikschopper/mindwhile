// @vitest-environment happy-dom
import { createActiveClock, createActivitySignal, type ActivitySignal } from '@mindwhile/core';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { createLayerRegistry, provideLayers } from '../runtime/layers';
import { usePause, type UsePauseOptions } from './use-pause';

type PauseApi = ReturnType<typeof usePause>;

function host(options: UsePauseOptions | undefined, registry = createLayerRegistry()) {
  let api!: PauseApi;
  const Child = defineComponent({
    setup() {
      api = usePause(options);
      return () => h('div');
    },
  });
  const Host = defineComponent({
    setup() {
      provideLayers(registry);
      return () => h(Child);
    },
  });
  const wrapper = mount(Host);
  return { api, wrapper, registry };
}

function stubClock() {
  return { pause: vi.fn(), resume: vi.fn() };
}

function setup(pauseOnReturn?: boolean) {
  const activity: ActivitySignal = createActivitySignal(true);
  const clock = stubClock();
  return { activity, clock, ...host({ clock, activity, pauseOnReturn }) };
}

describe('usePause', () => {
  it('starts not paused', () => {
    expect(setup().api.paused.value).toBe(false);
  });

  it('pauses, resumes and toggles', () => {
    const { api } = setup();
    api.pause();
    expect(api.paused.value).toBe(true);
    api.resume();
    expect(api.paused.value).toBe(false);
    api.toggle();
    expect(api.paused.value).toBe(true);
    api.toggle();
    expect(api.paused.value).toBe(false);
  });

  it('calls the clock once per real transition', () => {
    const { api, clock } = setup();
    api.pause();
    api.pause();
    expect(clock.pause).toHaveBeenCalledTimes(1);
    api.resume();
    api.resume();
    expect(clock.resume).toHaveBeenCalledTimes(1);
  });

  it('resume without a pause does nothing', () => {
    const { api, clock } = setup();
    api.resume();
    expect(api.paused.value).toBe(false);
    expect(clock.resume).not.toHaveBeenCalled();
  });

  it('works without a clock', () => {
    const { api } = host({ activity: createActivitySignal(true) });
    api.pause();
    expect(api.paused.value).toBe(true);
    api.resume();
    expect(api.paused.value).toBe(false);
  });

  it('registers a layer while paused and the Back key resumes', () => {
    const { api, clock, registry } = setup();
    expect(registry.closeTopmost()).toBe(false);
    api.pause();
    expect(registry.closeTopmost()).toBe(true);
    expect(api.paused.value).toBe(false);
    expect(clock.resume).toHaveBeenCalledTimes(1);
    expect(registry.closeTopmost()).toBe(false);
  });

  it('without pauseOnReturn, returning does not pause', () => {
    const { api, activity, clock } = setup();
    activity.set(false);
    activity.set(true);
    expect(api.paused.value).toBe(false);
    expect(clock.pause).not.toHaveBeenCalled();
  });

  it('with pauseOnReturn, only returning pauses, once', () => {
    const { api, activity, clock } = setup(true);
    activity.set(false);
    expect(api.paused.value).toBe(false);
    activity.set(true);
    expect(api.paused.value).toBe(true);
    expect(clock.pause).toHaveBeenCalledTimes(1);
  });

  it('stays paused after background and return', () => {
    const { api, activity, clock } = setup(true);
    api.pause();
    activity.set(false);
    activity.set(true);
    expect(api.paused.value).toBe(true);
    expect(clock.pause).toHaveBeenCalledTimes(1);
    expect(clock.resume).not.toHaveBeenCalled();
  });

  it('removes the subscription on unmount', () => {
    const { api, activity, wrapper } = setup(true);
    wrapper.unmount();
    activity.set(false);
    activity.set(true);
    expect(api.paused.value).toBe(false);
  });

  it('stops the real active clock while paused', () => {
    let t = 0;
    const activity = createActivitySignal(true);
    const clock = createActiveClock({ activity, now: () => t });
    const { api } = host({ clock, activity });
    t = 100;
    expect(clock.elapsedMs()).toBe(100);
    api.pause();
    t = 500;
    expect(clock.elapsedMs()).toBe(100);
    api.resume();
    t = 600;
    expect(clock.elapsedMs()).toBe(200);
  });
});
