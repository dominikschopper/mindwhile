import { describe, expect, it } from 'vitest';
import type { ScorePosition } from './contract';
import { findBest, recordResult } from './best-results';
import type { StoredResult } from './profile-format';

const higher: readonly ScorePosition[] = [{ key: 'points', better: 'higher' }];
const lower: readonly ScorePosition[] = [{ key: 'moves', better: 'lower' }];

function result(overrides: Partial<StoredResult> = {}): StoredResult {
  return {
    gameId: 'spill-it',
    gameVersion: 1,
    level: 'a',
    seed: 42,
    scoreValues: [500],
    scoringVersion: 1,
    ...overrides,
  };
}

describe('recordResult', () => {
  it('adds the first result to an empty list', () => {
    const entry = result();
    expect(recordResult([], entry, higher)).toEqual([entry]);
  });

  it('replaces a worse existing result and keeps its position', () => {
    const other = result({ level: 'b', scoreValues: [200] });
    const first = result({ seed: 1, scoreValues: [100] });
    const better = result({ seed: 3, scoreValues: [300] });
    const next = recordResult([first, other], better, higher);
    expect(next).toEqual([better, other]);
    expect(next[0]).toBe(better);

    const middle = recordResult([other, first], better, higher);
    expect(middle).toEqual([other, better]);
  });

  it('keeps the list when the new result is worse', () => {
    const existing = result({ scoreValues: [500] });
    const next = recordResult([existing], result({ seed: 9, scoreValues: [400] }), higher);
    expect(next).toEqual([existing]);
  });

  it('keeps the list when the new result is equal', () => {
    const existing = result({ seed: 1, scoreValues: [500] });
    const next = recordResult([existing], result({ seed: 2, scoreValues: [500] }), higher);
    expect(next).toEqual([existing]);
    expect(next[0]).toBe(existing);
  });

  it('treats another level, scoring version or game as a separate entry', () => {
    const a = result({ level: 'a' });
    const b = result({ level: 'b', scoreValues: [1] });
    const otherVersion = result({ scoringVersion: 2, scoreValues: [1] });
    const otherGame = result({ gameId: 'other-game', scoreValues: [1] });
    const list = [a, b, otherVersion, otherGame].reduce<StoredResult[]>(
      (acc, entry) => recordResult(acc, entry, higher),
      [],
    );
    expect(list).toEqual([a, b, otherVersion, otherGame]);
  });

  it('replaces by the lower score when lower is better', () => {
    const existing = result({ seed: 1, scoreValues: [30] });
    const better = result({ seed: 2, scoreValues: [20] });
    const worse = result({ seed: 3, scoreValues: [40] });
    expect(recordResult([existing], better, lower)).toEqual([better]);
    expect(recordResult([existing], worse, lower)).toEqual([existing]);
  });

  it('does not replace an existing entry when the score length is wrong', () => {
    const existing = result({ scoreValues: [500] });
    const wrongLength = result({ seed: 2, scoreValues: [900, 1] });
    expect(recordResult([existing], wrongLength, higher)).toEqual([existing]);
  });

  it('adds a result with wrong score length when there is no entry for its key yet', () => {
    const wrongLength = result({ scoreValues: [900, 1] });
    expect(recordResult([], wrongLength, higher)).toEqual([wrongLength]);
  });

  it('does not mutate the input list or its entries', () => {
    const existing = result({ scoreValues: [100] });
    const list: StoredResult[] = [existing];
    const snapshot = copyList(list);
    const better = result({ seed: 2, scoreValues: [200] });
    const next = recordResult(list, better, higher);
    expect(list).toEqual(snapshot);
    expect(list[0]).toBe(existing);
    expect(next).not.toBe(list);
  });
});

describe('findBest', () => {
  const list = [
    result({ level: 'a', scoreValues: [100] }),
    result({ level: 'b', scoreValues: [200] }),
    result({ level: 'a', scoringVersion: 2, scoreValues: [300] }),
  ];

  it('finds the entry for game, level and scoring version', () => {
    expect(findBest(list, 'spill-it', 'b', 1)).toEqual(list[1]);
    expect(findBest(list, 'spill-it', 'a', 2)).toEqual(list[2]);
  });

  it('returns undefined when no entry matches', () => {
    expect(findBest(list, 'spill-it', 'c', 1)).toBeUndefined();
    expect(findBest(list, 'other-game', 'a', 1)).toBeUndefined();
    expect(findBest([], 'spill-it', 'a', 1)).toBeUndefined();
  });
});

function copyList(list: readonly StoredResult[]): StoredResult[] {
  return list.map((entry) => ({ ...entry, scoreValues: [...entry.scoreValues] }));
}
