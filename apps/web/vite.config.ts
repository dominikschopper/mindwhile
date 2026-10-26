import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import { layerOrderFirst } from './build/layer-order.ts'
import { sfcLayer } from './build/sfc-layer.ts'

// The games live outside the Vite root, dev server must be allowed to read them.
const workspaceRoot = new URL('../..', import.meta.url).pathname

// `VITE_BASE` sets the public base path, for example `/mindwhile/` on GitHub Pages
// (a project page). Without it the app is served from `/`.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, new URL('.', import.meta.url).pathname, 'VITE_')
  return {
    base: env.VITE_BASE ?? '/',
    plugins: [vue(), layerOrderFirst()],
    css: { postcss: { plugins: [sfcLayer] } },
    server: { fs: { allow: [workspaceRoot] } },
  }
})
