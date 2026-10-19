import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { layerOrderFirst } from './build/layer-order.ts'
import { sfcLayer } from './build/sfc-layer.ts'

// The games live outside the Vite root, dev server must be allowed to read them.
const workspaceRoot = new URL('../..', import.meta.url).pathname

export default defineConfig({
  plugins: [vue(), layerOrderFirst()],
  css: { postcss: { plugins: [sfcLayer] } },
  server: { fs: { allow: [workspaceRoot] } },
})
