import type { GameModule } from '@mindwhile/core';
import type { Component } from 'vue';
import HowToPlay from './how-to-play/HowToPlay.vue';
import LevelPreview from './level-preview/LevelPreview.vue';
import { manifest } from './manifest';
import { createRound } from './round/round';
import SpillItView from './play/SpillItView.vue';

export const gameModule: GameModule<Component> = {
  manifest,
  createRound,
  View: SpillItView,
  HowToPlay,
  LevelPreview,
};

export default gameModule;
