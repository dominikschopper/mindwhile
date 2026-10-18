import js from '@eslint/js'
import boundaries from 'eslint-plugin-boundaries'
import prettier from 'eslint-config-prettier'
import vue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['**/dist/**', 'node_modules/**', 'ignore/**', '.plans/**'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  vue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    plugins: { boundaries },
    settings: {
      'import/resolver': { node: { extensions: ['.ts', '.vue', '.js'] } },
      'boundaries/elements': [
        { type: 'core', pattern: 'packages/core' },
        { type: 'game-kit', pattern: 'packages/game-kit' },
        { type: 'game', pattern: 'packages/games/*', capture: ['game'] },
        { type: 'web-common', pattern: 'apps/web/src/common' },
        { type: 'web-feature', pattern: 'apps/web/src/*', capture: ['feature'] },
        // everything else in apps/web (main.ts, router.ts, App.vue, config)
        { type: 'web-shell', pattern: 'apps/web' },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        2,
        {
          default: 'allow',
          checkAllOrigins: true,
          policies: [
            {
              from: { element: { type: 'core' } },
              disallow: {
                to: {
                  element: { type: ['game-kit', 'game', 'web-common', 'web-shell', 'web-feature'] },
                },
              },
            },
            {
              from: { element: { type: 'core' } },
              disallow: { to: { module: { origin: 'external', source: '{vue,vue-router}' } } },
            },
            {
              from: { element: { type: 'game-kit' } },
              disallow: {
                to: { element: { type: ['game', 'web-common', 'web-shell', 'web-feature'] } },
              },
            },
            {
              from: { element: { type: 'game' } },
              disallow: {
                to: { element: { type: ['web-common', 'web-shell', 'web-feature'] } },
              },
            },
            {
              from: { element: { type: ['web-common', 'web-feature', 'web-shell'] } },
              disallow: { to: { element: { type: 'game' } } },
            },
            {
              from: { element: { type: 'web-common' } },
              disallow: { to: { element: { type: 'web-feature' } } },
            },
            {
              from: { element: { type: 'web-feature' } },
              disallow: {
                to: {
                  element: {
                    type: 'web-feature',
                    captured: { feature: '!{{ from.captured.feature }}' },
                  },
                },
              },
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/games/**/*.{ts,vue}'],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Games use the seeded integer generator from core, not Math.random().',
        },
      ],
    },
  },
  prettier,
)
