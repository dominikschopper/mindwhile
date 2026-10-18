# Mindwhile

*Working title.* A privacy-friendly progressive web app (PWA) with very simple, small logic games for smartphones, for passing time intelligently. No tracking, no ads, no chat, minimal running costs.

**Status:** planning. The concept and the formats are documented, the first beta (one game) is planned, no code yet.

## Principles

- No tracking, no ads
- No chat
- Minimal running costs, static hosting only, no backend at the start
- Maintenance-free: weeks without intervention must be possible, an outage must never affect the games
- Offline-first: everything essential works without a network
- Identity without an account: a gamer tag, a symbol and a random player ID live on the device and move between devices by export
- Small app: as few runtime dependencies as possible (Vue and vue-router in the beta)

## What it will be

- A collection of small logic games, each a package of its own with its own versions
- Best results per game, no overall ranking
- Later: asynchronous mini groups (2 to 10 people) that compare the same board, shared by QR code or link, without a server
- The beta consists of one game, **Spillit** (working title, mechanic: flood fill), to get the platform parts right first: first start, gamer tag, profile export and restore, updates, news

## Documents

| Document | Content |
|---|---|
| [`architecture.md`](docs/architecture.md) | Principles, profile and backup, round flow, versions, update activation, groups, news |
| [`data-formats.md`](docs/data-formats.md) | Exact data formats: keys, envelope, result, profile, limits, transport |
| [`game-contract.md`](docs/game-contract.md) | The interface between platform and game |
| [`tech-stack.md`](docs/tech-stack.md) | Technology decisions, structure, conventions, hosting |
| [`game-flood-fill.md`](docs/game-flood-fill.md) | Concept of the first game |
| [`game-candidates.md`](docs/game-candidates.md) | Candidates for further games |
| [`glossary.md`](docs/glossary.md) | Terms and their English code names |

## Technology in short

TypeScript, Vue 3 and vue-router, Vite and Vitest as dev tools, a pnpm workspace (`packages/core`, `packages/game-kit`, `packages/games/*`, `apps/web`), an own small service worker, localStorage behind a small interface, own `t()` for texts. Details in [`tech-stack.md`](docs/tech-stack.md).

## Conventions

- Everything technical is named in English (files, identifiers, keys in formats, commit messages)
- [Conventional Commits](https://www.conventionalcommits.org/), scope is the game ID or the feature
- No TypeScript enums, always `const` with `as const`

## License

The code is licensed under GPL-3.0-or-later. The license of texts, documents and graphics is still to be decided (candidates: CC BY-SA 4.0 or CC BY 4.0). The names Mindwhile and Spillit are working titles of the project and are not covered by the code license, forks should choose their own names.
