import { describe, expect, it } from 'vitest';
import { migrate, migrationSteps } from './migrations';
import type { MigrationStep } from './migrations';
import { DATA_FORMAT_VERSION } from './profile-format';

const addNote: MigrationStep = (data) => {
  const old = data as { name: string };
  return { ...old, note: 'added' };
};

const renameNote: MigrationStep = (data) => {
  const old = data as { name: string; note: string };
  return { name: old.name, memo: old.note };
};

const fakeSteps: readonly MigrationStep[] = [addNote, renameNote];

describe('migrationSteps', () => {
  it('has one step less than the current data format version', () => {
    expect(migrationSteps.length + 1).toBe(DATA_FORMAT_VERSION);
  });
});

describe('migrate', () => {
  it('returns the same object for the current version', () => {
    const data = { name: 'x' };
    expect(migrate(data, DATA_FORMAT_VERSION)).toBe(data);
  });

  it('runs all steps in order from version 1', () => {
    expect(migrate({ name: 'x' }, 1, fakeSteps)).toEqual({ name: 'x', memo: 'added' });
  });

  it('runs only the remaining steps from version 2', () => {
    expect(migrate({ name: 'x', note: 'old' }, 2, fakeSteps)).toEqual({
      name: 'x',
      memo: 'old',
    });
  });

  it('returns data unchanged when there are no steps', () => {
    const data = { name: 'x' };
    expect(migrate(data, 1, [])).toBe(data);
  });

  it('throws a RangeError for version 0, 1.5 and above the latest version', () => {
    const latest = fakeSteps.length + 1;
    expect(() => migrate({}, 0, fakeSteps)).toThrow(RangeError);
    expect(() => migrate({}, 1.5, fakeSteps)).toThrow(RangeError);
    expect(() => migrate({}, latest + 1, fakeSteps)).toThrow(RangeError);
  });

  it('does not mutate its input', () => {
    const data = { name: 'x' };
    const snapshot = JSON.stringify(data);
    migrate(data, 1, fakeSteps);
    expect(JSON.stringify(data)).toBe(snapshot);
  });
});
