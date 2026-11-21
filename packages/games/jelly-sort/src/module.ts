import type { GameModule } from '@mindwhile/core';
import type { Component } from 'vue';
import HowToPlay from './how-to-play/HowToPlay.vue';
import { manifest } from './manifest';
import JellySortView from './play/JellySortView.vue';
import { createRound } from './round/round';

// View and how-to-play are placeholders until later tasks.
export const gameModule: GameModule<Component> = {
  manifest,
  createRound,
  View: JellySortView,
  HowToPlay,
};

export default gameModule;
