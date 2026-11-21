import { t } from '../common/texts/translate';

// Score is [points, deviation]: points first, the deviation from par as detail.
// The short form only has the points, for the start page tile.
export function formatScoreShort(score: readonly number[]): string {
  return t('score.points', { points: score[0] ?? 0 });
}

export function formatScore(score: readonly number[]): string {
  const points = score[0] ?? 0;
  const deviation = score[1] ?? 0;
  const detail =
    deviation === 0
      ? t('score.onPar')
      : deviation < 0
        ? t('score.faster', { count: -deviation })
        : t('score.slower', { count: deviation });
  return t('score.summary', { points, detail });
}
