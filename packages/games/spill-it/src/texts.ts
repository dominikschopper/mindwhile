import type { GameTexts } from '@mindwhile/core'
import { formatScore } from './format-score'
import { manifest } from './manifest'
import { t } from './texts/translate'

export { t }

export const gameTexts: GameTexts = {
  name: t('game.name'),
  tagline: t('game.tagline'),
  summary: t('game.summary'),
  levelName(level) {
    if (!(manifest.levels as readonly string[]).includes(level)) {
      throw new Error(`Unknown level: ${level}`)
    }
    return t(`level.${level as (typeof manifest.levels)[number]}`)
  },
  formatScore,
}
