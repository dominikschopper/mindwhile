import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

// Tests run in node by default. Component tests opt in per file with
// `// @vitest-environment happy-dom` at the top.
export default defineConfig({
  plugins: [vue()],
  test: { environment: 'node' },
})
