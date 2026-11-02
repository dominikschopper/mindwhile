import { createRng } from '@mindwhile/core';
import { describe, expect, it } from 'vitest';
import { adjectives, animals, createDefaultTag } from './default-tag';

describe('word lists', () => {
  for (const [name, list] of [
    ['adjectives', adjectives],
    ['animals', animals],
  ] as const) {
    it(`${name} has 100 unique well-formed entries`, () => {
      expect(list).toHaveLength(100);
      expect(new Set(list).size).toBe(100);
      for (const word of list) expect(word).toMatch(/^[A-Z][a-z]{2,6}$/);
    });
  }

  it('every possible tag is at most 15 characters', () => {
    const longestAdjective = Math.max(...adjectives.map((w) => w.length));
    const longestAnimal = Math.max(...animals.map((w) => w.length));
    expect(longestAdjective + 1 + longestAnimal).toBeLessThanOrEqual(15);
  });
});

describe('createDefaultTag', () => {
  it('is deterministic per seed and shaped adjective + animal', () => {
    const a = createDefaultTag(createRng(42));
    expect(createDefaultTag(createRng(42))).toBe(a);
    const [adjective, animal] = a.split(' ');
    expect(adjectives).toContain(adjective);
    expect(animals).toContain(animal);
  });

  it('varies across seeds', () => {
    const tags = new Set<string>();
    for (let seed = 0; seed < 200; seed++) tags.add(createDefaultTag(createRng(seed)));
    expect(tags.size).toBeGreaterThan(50);
  });
});
