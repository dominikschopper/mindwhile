import type { GameModule } from '@mindwhile/core';
import type { Component } from 'vue';
import HowToPlay from './how-to-play/HowToPlay.vue';
import { manifest } from './manifest';
import JellySortView from './play/JellySortView.vue';
import { createRound } from './round/round';

// How-to-play is a placeholder until a later task.
export const gameModule: GameModule<Component> = {
  manifest,
  createRound,
  View: JellySortView,
  HowToPlay,
};

export default gameModule;
