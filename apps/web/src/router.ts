import { createRouter, createWebHistory } from 'vue-router'
import GameSelectionView from './game-selection/GameSelectionView.vue'
import PlayView from './play/PlayView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'game-selection', component: GameSelectionView },
    { path: '/play/:gameId/:challenge', name: 'play', component: PlayView, props: true },
  ],
})
