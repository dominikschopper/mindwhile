import '@mindwhile/game-kit/styles/index.css'
import { createApp } from 'vue'
import App from './App.vue'
import './common/styles/layout.css'
import { router } from './router'

createApp(App).use(router).mount('#app')
