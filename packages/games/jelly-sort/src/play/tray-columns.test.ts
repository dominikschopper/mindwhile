import { describe, expect, it } from 'vitest';
import { rowSizes, trayColumns } from './tray-columns';

// tray 54, gap 16: n columns need 70n - 16 px.
describe('trayColumns', () => {
  it('keeps one row when everything fits', () => {
    expect(trayColumns(6, 420)).toBe(6);
    expect(trayColumns(8, 560)).toBe(8);
    expect(trayColumns(10, 700)).toBe(10);
  });

  it('splits into two equal rows when too wide', () => {
    expect(trayColumns(6, 300)).toBe(3);
    expect(trayColumns(8, 448)).toBe(4);
    expect(trayColumns(10, 448)).toBe(5);
  });

  it('gives 5 + 5 for 10 trays at phone width', () => {
    expect(trayColumns(10, 368)).toBe(5);
    expect(trayColumns(8, 368)).toBe(4);
    expect(trayColumns(6, 368)).toBe(3);
  });

  it('spreads an uneven count with the longer row first', () => {
    expect(trayColumns(7, 300)).toBe(4);
    expect(rowSizes(7, 4)).toEqual([4, 3]);
    expect(rowSizes(13, 5)).toEqual([5, 4, 4]);
  });

  it('uses one column when not even one tray fits', () => {
    expect(trayColumns(6, 20)).toBe(1);
    expect(trayColumns(6, 0)).toBe(1);
  });

  it('handles a single tray', () => {
    expect(trayColumns(1, 400)).toBe(1);
    expect(trayColumns(1, 10)).toBe(1);
  });
});

describe('rowSizes', () => {
  it('gives equal rows for the shipped counts', () => {
    expect(rowSizes(6, 3)).toEqual([3, 3]);
    expect(rowSizes(8, 4)).toEqual([4, 4]);
    expect(rowSizes(10, 5)).toEqual([5, 5]);
    expect(rowSizes(6, 6)).toEqual([6]);
  });
  it('is empty for no trays', () => {
    expect(rowSizes(0, 3)).toEqual([]);
  });
});
