import type { GameModule } from '@mindwhile/core';
import type { Component } from 'vue';
import HowToPlay from './how-to-play/HowToPlay.vue';
import { manifest } from './manifest';
import JellySortView from './play/JellySortView.vue';

// Placeholders, the round, view and how-to-play come with later tasks.
export const gameModule: GameModule<Component> = {
  manifest,
  createRound() {
    throw new Error('not implemented');
  },
  View: JellySortView,
  HowToPlay,
};

export default gameModule;
