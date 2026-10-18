import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// The games live outside the Vite root, dev server must be allowed to read them.
const workspaceRoot = new URL('../..', import.meta.url).pathname

export default defineConfig({
  plugins: [vue()],
  server: { fs: { allow: [workspaceRoot] } },
})
