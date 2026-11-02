import { describe, expect, it } from 'vitest';
import { createActiveClock } from './active-clock';
import { createActivitySignal } from './activity';

function setup(options: { active?: boolean; saved?: unknown } = {}) {
  let time = 1000;
  const activity = createActivitySignal(options.active ?? true);
  const clock = createActiveClock({ activity, now: () => time, saved: options.saved });
  return {
    activity,
    clock,
    advance(ms: number) {
      time += ms;
    },
    setTime(value: number) {
      time = value;
    },
  };
}

describe('createActiveClock', () => {
  it('counts while active', () => {
    const { clock, advance } = setup();
    advance(250);
    expect(clock.elapsedMs()).toBe(250);
    advance(100);
    expect(clock.elapsedMs()).toBe(350);
  });

  it('stops while inactive and resumes without the gap', () => {
    const { clock, activity, advance } = setup();
    advance(100);
    activity.set(false);
    advance(5000);
    expect(clock.elapsedMs()).toBe(100);
    activity.set(true);
    advance(50);
    expect(clock.elapsedMs()).toBe(150);
  });

  it('pauses and resumes', () => {
    const { clock, advance } = setup();
    advance(100);
    clock.pause();
    expect(clock.isRunning()).toBe(false);
    advance(1000);
    expect(clock.elapsedMs()).toBe(100);
    clock.resume();
    advance(20);
    expect(clock.elapsedMs()).toBe(120);
  });

  it('does not run when paused and resumed while inactive, starts once active', () => {
    const { clock, activity, advance } = setup();
    activity.set(false);
    clock.pause();
    clock.resume();
    expect(clock.isRunning()).toBe(false);
    advance(500);
    expect(clock.elapsedMs()).toBe(0);
    activity.set(true);
    expect(clock.isRunning()).toBe(true);
    advance(30);
    expect(clock.elapsedMs()).toBe(30);
  });

  it('does not start while paused when the signal turns active', () => {
    const { clock, activity, advance } = setup();
    clock.pause();
    activity.set(false);
    activity.set(true);
    advance(100);
    expect(clock.isRunning()).toBe(false);
    expect(clock.elapsedMs()).toBe(0);
  });

  it('is idempotent for pause and resume twice in a row', () => {
    const { clock, advance } = setup();
    advance(10);
    clock.pause();
    clock.pause();
    advance(100);
    expect(clock.elapsedMs()).toBe(10);
    clock.resume();
    clock.resume();
    advance(5);
    expect(clock.elapsedMs()).toBe(15);
  });

  it('serializes and restores from saved', () => {
    const first = setup();
    first.advance(400);
    const data = JSON.parse(JSON.stringify(first.clock.serialize()));
    expect(data).toEqual({ elapsedMs: 400 });

    const second = setup({ saved: data });
    expect(second.clock.elapsedMs()).toBe(400);
    second.advance(100);
    expect(second.clock.elapsedMs()).toBe(500);
  });

  it.each([-5, Number.NaN, 'x', {}, undefined, null, { elapsedMs: -1 }, { elapsedMs: Infinity }])(
    'starts at 0 for invalid saved value %j',
    (saved) => {
      const { clock } = setup({ saved });
      expect(clock.elapsedMs()).toBe(0);
    },
  );

  it('returns the total while stopped', () => {
    const { clock, activity, advance } = setup({ saved: { elapsedMs: 70 } });
    advance(30);
    activity.set(false);
    advance(999);
    expect(clock.elapsedMs()).toBe(100);
    expect(clock.serialize()).toEqual({ elapsedMs: 100 });
  });

  it('never gives a negative or decreasing value when now goes backwards', () => {
    const { clock, activity, advance, setTime } = setup();
    advance(100);
    expect(clock.elapsedMs()).toBe(100);
    setTime(500);
    expect(clock.elapsedMs()).toBeGreaterThanOrEqual(0);
    activity.set(false);
    expect(clock.elapsedMs()).toBe(100);
  });

  it('does not count when created while inactive', () => {
    const { clock, advance } = setup({ active: false });
    advance(1000);
    expect(clock.isRunning()).toBe(false);
    expect(clock.elapsedMs()).toBe(0);
  });

  it('subscribe reports changes only and unsubscribe works', () => {
    const { clock, activity } = setup();
    const seen: boolean[] = [];
    const unsubscribe = clock.subscribe((running) => seen.push(running));
    clock.resume();
    expect(seen).toEqual([]);
    clock.pause();
    clock.pause();
    clock.resume();
    activity.set(false);
    activity.set(true);
    expect(seen).toEqual([false, true, false, true]);
    unsubscribe();
    clock.pause();
    expect(seen).toEqual([false, true, false, true]);
  });

  it('lets a listener unsubscribe while running', () => {
    const { clock } = setup();
    const seen: string[] = [];
    const off = clock.subscribe(() => {
      seen.push('a');
      off();
    });
    clock.subscribe(() => seen.push('b'));
    clock.pause();
    clock.resume();
    expect(seen).toEqual(['a', 'b', 'b']);
  });

  it('stop freezes the total, removes the listener and tells subscribers once', () => {
    const { clock, activity, advance } = setup();
    const seen: boolean[] = [];
    clock.subscribe((running) => seen.push(running));
    advance(200);
    clock.stop();
    expect(seen).toEqual([false]);
    advance(500);
    expect(clock.elapsedMs()).toBe(200);
    activity.set(false);
    activity.set(true);
    clock.resume();
    clock.pause();
    advance(500);
    expect(clock.isRunning()).toBe(false);
    expect(clock.elapsedMs()).toBe(200);
    expect(seen).toEqual([false]);
  });

  it('does not change anything on a second stop', () => {
    const { clock, advance } = setup();
    advance(40);
    clock.stop();
    clock.stop();
    advance(40);
    expect(clock.elapsedMs()).toBe(40);
  });

  it('stop while not running does not notify', () => {
    const { clock, activity } = setup();
    activity.set(false);
    const seen: boolean[] = [];
    clock.subscribe((running) => seen.push(running));
    clock.stop();
    expect(seen).toEqual([]);
  });
});
