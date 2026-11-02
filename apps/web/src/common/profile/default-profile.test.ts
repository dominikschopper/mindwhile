import { parseProfile, serializeProfile } from '@mindwhile/core';
import { profileSymbolNames } from '@mindwhile/game-kit';
import { describe, expect, it } from 'vitest';
import { createDefaultProfile } from './default-profile';

describe('createDefaultProfile', () => {
  it('gives the same tag and symbol for the same seed, but a new player ID', () => {
    const a = createDefaultProfile(7, 1000);
    const b = createDefaultProfile(7, 2000);
    expect(b.gamerTag).toBe(a.gamerTag);
    expect(b.gamerSymbol).toBe(a.gamerSymbol);
    expect(b.playerId).not.toBe(a.playerId);
  });

  it('varies the tag across seeds and always uses a known symbol', () => {
    const tags = new Set<string>();
    for (let seed = 0; seed < 200; seed++) {
      const profile = createDefaultProfile(seed, 0);
      tags.add(profile.gamerTag);
      expect(profileSymbolNames).toContain(profile.gamerSymbol);
    }
    expect(tags.size).toBeGreaterThan(50);
  });

  it('sets gamerTagChangedAt to now', () => {
    expect(createDefaultProfile(1, 123456).gamerTagChangedAt).toBe(123456);
    expect(serializeProfile({ profile: createDefaultProfile(1, 99), best: [] }).profile.tagat).toBe(
      99,
    );
  });

  it('survives a serialize and parse round trip for 500 seeds', () => {
    for (let seed = 0; seed < 500; seed++) {
      const data = { profile: createDefaultProfile(seed, 1_700_000_000_000), best: [] };
      const result = parseProfile(serializeProfile(data));
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data.profile).toEqual(data.profile);
    }
  });
});
