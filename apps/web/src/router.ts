import { createRouter, createWebHistory } from 'vue-router'
import GameSelectionView from './game-selection/GameSelectionView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', name: 'game-selection', component: GameSelectionView }],
})
