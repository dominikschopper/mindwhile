import { describe, expect, it } from 'vitest';
import { gameTexts, t } from './texts';

describe('gameTexts', () => {
  it('has the game name, tagline and summary', () => {
    expect(gameTexts.name).toBe('Jelly Sort');
    expect(gameTexts.tagline.length).toBeGreaterThan(0);
    expect(gameTexts.summary).toContain('single color');
  });

  it('names the three levels', () => {
    expect(gameTexts.levelName('a')).toBe('4 colors');
    expect(gameTexts.levelName('b')).toBe('6 colors');
    expect(gameTexts.levelName('c')).toBe('8 colors');
  });

  it('throws for an unknown level', () => {
    expect(() => gameTexts.levelName('z')).toThrow();
  });
});

describe('t types', () => {
  it('rejects unknown keys', () => {
    // @ts-expect-error unknown key
    t('no.such.key');
  });
});
