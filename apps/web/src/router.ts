import { createRouter, createWebHistory } from 'vue-router'
import GameView from './game/GameView.vue'
import GameSelectionView from './game-selection/GameSelectionView.vue'
import PlayView from './play/PlayView.vue'
import SettingsView from './settings/SettingsView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'game-selection', component: GameSelectionView },
    { path: '/games/:id', name: 'game', component: GameView, props: true },
    { path: '/play/:gameId/:challenge', name: 'play', component: PlayView, props: true },
    { path: '/settings', name: 'settings', component: SettingsView },
  ],
})
