// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { router } from './router';

describe('router', () => {
  it('has no settings route, so /settings matches nothing', () => {
    expect(router.hasRoute('settings')).toBe(false);
    expect(router.resolve('/settings').matched).toHaveLength(0);
  });
});
