import { expect, it } from 'vitest';
import { basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gameColors } from '@mindwhile/core';
import { manifest } from './manifest';

it('declares the three levels', () => {
  expect([...manifest.levels]).toEqual(['a', 'b', 'c']);
});

it('has an id that matches the folder name', () => {
  const folder = basename(dirname(dirname(fileURLToPath(import.meta.url))));
  expect(manifest.id).toBe(folder);
});

it('ranks more points as better, then a lower deviation', () => {
  expect(manifest.scoring.map(({ key, better }) => [key, better])).toEqual([
    ['points', 'higher'],
    ['deviation', 'lower'],
  ]);
});

it('shows the flask-conical symbol on the tile', () => {
  expect(manifest.symbol).toBe('flask-conical');
});

it('uses the green game color', () => {
  expect(manifest.color).toBe('green');
  expect(gameColors).toContain(manifest.color);
});

it('is at scoring version 0 until the first release', () => {
  expect(manifest.scoringVersion).toBe(0);
});
