import type { GameTexts } from '@mindwhile/core'
import { formatScore } from './format-score'
import { manifest } from './manifest'
import { t } from './texts/translate'

export { t }

export const gameTexts: GameTexts = {
  name: t('game.name'),
  challengeName(challenge) {
    if (!(manifest.challenges as readonly string[]).includes(challenge)) {
      throw new Error(`Unknown challenge: ${challenge}`)
    }
    return t(`challenge.${challenge as (typeof manifest.challenges)[number]}`)
  },
  formatScore,
}
