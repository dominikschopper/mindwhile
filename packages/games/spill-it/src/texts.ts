import { createT } from '@mindwhile/core'
import type { GameTexts } from '@mindwhile/core'
import { manifest } from './manifest'
import { en } from './texts/en'

export const t = createT(en)

export const gameTexts: GameTexts = {
  name: t('game.name'),
  challengeName(challenge) {
    if (!(manifest.challenges as readonly string[]).includes(challenge)) {
      throw new Error(`Unknown challenge: ${challenge}`)
    }
    return t(`challenge.${challenge as (typeof manifest.challenges)[number]}`)
  },
}
