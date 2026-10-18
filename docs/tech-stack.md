# Tech stack (Mindwhile)

Status: draft. Functional rules live in `architecture.md`, terms and English names in `glossary.md`.

## Requirements

- Small app size
- As few runtime dependencies as possible

**Terms:** Runtime dependencies are packages whose code ends up in the shipped bundle. Dev dependencies (build, tests, TypeScript) never reach the user and do not count for app size.

## Decided

### Basics

- **Language: TypeScript.** Game logic is pure TypeScript without UI references, so it stays easy to test
- **UI layer: Vue 3.** Chosen deliberately for familiarity and development speed. The extra weight compared to Preact or Svelte (roughly 15 to 20 KB gzip, estimated) is accepted. Countermeasures: only the runtime build without the template compiler, templates are precompiled at build time, and as few additional packages around Vue as possible
- **Router: vue-router.** Advantages: typed routes, guards that match our navigation rules (abort confirmation on back key and gesture), and it avoids our own mistakes with the History API. The extra weight (roughly 8 to 10 KB gzip, estimated) is accepted. There is exactly one router, in the platform. Games have no router of their own, not even a memory or hash router (see `game-contract.md`). The beta has no deep links into a game, they come with groups
- **State: Vue's own `reactive`, no Pinia.** There is no chat and little shared state
- **Build: Vite** as a pure dev tool (bundling, hashes in file names, splitting per game package)
- **Tests: Vitest** (dev only), also for the scoring tests
- **Runtime dependencies in the beta: only `vue` and `vue-router`.** Everything else is our own code or comes from the browser (service worker, storage, `t()`, state, random generator, `CompressionStream`). Vite, TypeScript, `vue-tsc` and Vitest are pure dev tools. One possible further dependency after the beta is generating QR codes (small package or own code, decided then)
- **Size: measure and print, no hard limit.** The build prints the sizes of the start files and of every game package (gzip). Failing the build on exceeding a limit is deliberately not planned. A limit can be added later. No separate measurement up front

### Structure

- **pnpm workspace.** `packages/core` (game contract, result and score types, score comparison, activity signal and active clock, pure TypeScript without Vue), `packages/game-kit` (Vue building blocks for games: `usePause`, `PauseCover`, `useElapsed`, how-to-play building blocks), `packages/games/*` (per game: logic, view, manifest, scoring tests) and `apps/web` (shell with router, profile, storage, update mechanism, i18n). A game may only know `core` and `game-kit`, the package structure enforces this (`game-kit` depends on `vue` and `core`, never on `apps/web`). The game contract in `core` is described in `game-contract.md`, the data formats in `data-formats.md`. Packages are consumed as TypeScript source (`exports` points to the source files), without a build of their own per package. The app finds games automatically through `import.meta.glob` on the manifest files and loads them on demand, a new game is just a new folder. What ships is still one complete state
- **Feature-based structure, everything that belongs together lives together (collocation).** Applies to `apps/web` and to every game package. A feature is a folder (for example `profile`, `export`, `updates`, `news`, `game-selection`) with everything that belongs to it: views, components, composables, types, styles and tests right next to each other, not split by file type into `components/`, `composables/`, `tests/`. What several features use lives in `common` (shared components in `common/components`, shared composables in `common/composables`). A feature imports from `common` but not from another feature
- **Rendering: decided per game, `core` contains nothing about it.** Every game brings its own view and picks DOM/CSS, SVG or canvas itself. DOM and CSS are enough for Spillit (grid of cells, filling via CSS transition, keyboard and screen reader almost for free)

### Conventions

- **Everything technical is named in English:** file names, folders, identifiers in code, keys in file formats (JSON), type names and commit messages. Examples: `news.json`, entry types `new`, `improved`, `fixed`. All documents are written in English as well and serve as the basis for the project READMEs. The mapping of terms to code names is in `glossary.md`
- **No TypeScript enums.** Constant values are always `const` with `as const`, types are derived from them (`(typeof X)[number]`, `keyof typeof X`)
- Enforcement automatically instead of by hand: `erasableSyntaxOnly` in the `tsconfig` (TypeScript 5.8 and later) forbids enums and other syntax that cannot simply be erased. In addition a lint rule if needed
- **Commits: Conventional Commits** with `scope` = game ID or feature, only the standard types, no special rules

### Texts

- **i18n: our own thin `t()` function instead of vue-i18n.** The English texts live as a TypeScript constant (`as const`), the compiler derives keys and parameter names automatically, without a generator and without manual upkeep. `vue-tsc` in the build reports unknown keys and missing parameters. Plurals via `Intl.PluralRules`. Further languages are checked against the same types later. The call `t('key', params)` stays compatible with vue-i18n, a later switch would be possible
- **One language file per game and per shell feature** (for example `en.ts` next to the code). Keys are combined into the overall type with the game ID or feature name as prefix, automatically and without manual upkeep. There is only one rule for texts. The display names of the platform (Mindwhile) and of the games (Spillit) also live in these files

### Storage and offline

- **Storage: localStorage behind a small interface** (`get`, `set`, `remove` with version number and migration), no wrapper package. The `storage` event helps with several open windows. A later switch to IndexedDB stays confined to the interface
- **Service worker: our own small one instead of Workbox.** Precache of all files on install, cache-first on fetch, delete old caches on activation. The build generates the precache manifest from the hashed files. Activation only after a message from the app (no automatic `skipWaiting`), so that the update rules from `architecture.md` apply

### Hosting and repository

- **Hosting: a European provider instead of GitHub Pages.** statichost.eu (build via webhook, delivery through a CDN, custom domain via CNAME, automatic HTTPS). Headers via a `_headers` file (according to the provider), so that `sw.js` is not cached for long. The Hobby plan is free (1 site, 10 GB traffic, 100 build minutes per month). The beta runs on the provider's default address, a custom domain comes after the name check
- **Repository:** `mindwhile`, on GitHub for now. By the end of the year the maintainer moves all relevant projects, including Mindwhile, to Codeberg (a non-profit association from Berlin, servers in Germany). The provider builds via webhook from any Git host, so a move only changes the webhook
- **License for the code: GPL-3.0-or-later.** Forks must stay open, so a promise like "no tracking" stays checkable. A license cannot enforce "no tracking, no ads" (such licenses are not free software), so the guardrails remain a documented promise of the project. According to INNOQ, Codeberg allows private repositories only for free software and small personal content, so the repository is public after the move
- **Names are separate from the license:** The names Mindwhile and Spillit belong to the project and are not granted by the code license, forks should choose their own names
- **Changelog in two levels:** The technical `CHANGELOG.md` is generated automatically from the commits and is not shipped. The news file `news.json` is created as a draft from it at release time and written by hand for players (see `architecture.md`). git-cliff is under discussion as the tool for the changelog

### Workspace tooling

- **Node 24** (`.nvmrc`, `engines`), pnpm pinned through `packageManager`. Package names `@mindwhile/core`, `@mindwhile/game-kit`, `@mindwhile/game-spill-it`, `@mindwhile/web`
- **Router mode: history** (SPA fallback at the host is still to be checked, see Open)
- **TypeScript 6 for now:** `vue-tsc` 3.3 does not run with TypeScript 7 (native compiler). Move up when `vue-tsc` supports it
- **Shared `tsconfig.base.json`**, one `tsconfig` per package (`core` without the DOM lib), type check via `vue-tsc` for the web app and `tsc` for the packages
- **Lint and format:** ESLint (flat config) with `eslint-plugin-boundaries`, relative imports are resolved with the node resolver (`.ts` and `.vue` extensions). Prettier for code, Markdown is excluded. Boundaries cover game, game-kit, core and the web features. Imports by package name are not resolved by the plugin, there the declared `dependencies` of each package are the guard
- **Game discovery:** `import.meta.glob` over `packages/games/*/src/manifest.ts` (eager, manifests are pure data). Works in dev (`server.fs.allow` for the workspace) and in build
- **Scoring tests:** Vitest files `src/scoring.<challenge>.test.ts` in the game package, enforced by `checks/scoring-tests.test.ts`

## Proposals (still to be confirmed)

- **Compression for the export:** the browser's `CompressionStream`, without a package
- **QR (after the beta):** generating with a very small package, scanning through the browser's camera interface where available

## Open

- Router mode of the platform: history or hash. History mode needs an SPA fallback at the host (not verified for statichost.eu), hash mode collides with the import links whose payload sits after the `#` (they would need a route such as `#/import/<payload>`). Decide together with the hosting check
- Check the type derivation of the `t()` keys across several language files against a real build
- Check git-cliff: as far as we know it runs locally and independently of the Git host, this is not verified yet
- Hosting: which path patterns the Hobby plan allows for headers (one exact path for `sw.js` is enough) and what happens when the quota is exceeded
- **License for texts, documents and graphics:** Software licenses do not fit them. Candidates are CC BY-SA 4.0 or CC BY 4.0, to be decided
