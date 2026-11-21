import type { GameTexts } from '@mindwhile/core';
import { manifest } from './manifest';
import { t } from './common/texts/translate';

export { t };

// Placeholders, the real score formatting comes with the scoring task.
function formatScoreShort(score: readonly number[]): string {
  return t('score.points', { points: score[0] ?? 0 });
}

function formatScore(score: readonly number[]): string {
  return formatScoreShort(score);
}

export const gameTexts: GameTexts = {
  name: t('game.name'),
  tagline: t('game.tagline'),
  summary: t('game.summary'),
  levelName(level) {
    if (!(manifest.levels as readonly string[]).includes(level)) {
      throw new Error(`Unknown level: ${level}`);
    }
    return t(`level.${level as (typeof manifest.levels)[number]}`);
  },
  formatScore,
  formatScoreShort,
};
