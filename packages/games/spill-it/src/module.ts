import type { GameModule } from '@mindwhile/core'
import type { Component } from 'vue'
import { formatScore } from './format-score'
import HowToPlay from './HowToPlay.vue'
import { manifest } from './manifest'
import { createRound } from './round'
import SpillItView from './SpillItView.vue'

export const gameModule: GameModule<Component> = {
  manifest,
  createRound,
  View: SpillItView,
  HowToPlay,
}

export { formatScore }

export default gameModule
