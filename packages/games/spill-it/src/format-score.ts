import { t } from './texts/translate'

// Score is [points, deviation]: points first, the deviation from par as detail.
export function formatScore(score: readonly number[]): string {
  const points = score[0] ?? 0
  const deviation = score[1] ?? 0
  const detail =
    deviation === 0
      ? t('score.onPar')
      : deviation < 0
        ? t('score.underPar', { count: -deviation })
        : t('score.overPar', { count: deviation })
  return t('score.summary', { points, detail })
}
