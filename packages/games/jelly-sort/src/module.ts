import type { GameModule } from '@mindwhile/core';
import type { Component } from 'vue';
import HowToPlay from './how-to-play/HowToPlay.vue';
import LevelPreview from './level-preview/LevelPreview.vue';
import { manifest } from './manifest';
import JellySortView from './play/JellySortView.vue';
import { createRound } from './round/round';

export const gameModule: GameModule<Component> = {
  manifest,
  createRound,
  View: JellySortView,
  HowToPlay,
  LevelPreview,
};

export default gameModule;
