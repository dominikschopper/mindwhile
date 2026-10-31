import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv, type PluginOption } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';
import { layerOrderFirst } from './build/layer-order.ts';
import { sfcLayer } from './build/sfc-layer.ts';

// The games live outside the Vite root, dev server must be allowed to read them.
const workspaceRoot = new URL('../..', import.meta.url).pathname;

function getVueDevToolsOptions(command: string) {
  const devToolsOptions: PluginOption = vueDevTools({ launchEditor: 'codium' });

  console.log('creating VueDevToolsOptions');

  if (command === 'serve') {
    console.log('adding VueDevToolsOptions');
    return [devToolsOptions];
  }
  return [];
}

// `VITE_BASE` sets the public base path, for example `/mindwhile/` on GitHub Pages
// (a project page). Without it the app is served from `/`.
// The Vue devtools overlay is only part of the dev server, never of the production build.
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, new URL('.', import.meta.url).pathname, 'VITE_');
  return {
    base: env.VITE_BASE ?? '/',
    plugins: [vue(), layerOrderFirst(), getVueDevToolsOptions(command)],
    css: { postcss: { plugins: [sfcLayer] } },
    server: { fs: { allow: [workspaceRoot] } },
  };
});
