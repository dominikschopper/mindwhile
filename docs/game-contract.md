# Game contract (Mindwhile)

Status: draft, filled decision by decision. The contract is the interface between platform and game and the content of `packages/core`. Rules and reasons live in `architecture.md`, formats in `data-formats.md`, terms in `glossary.md`.

## Decided

### Shape

- A game is split into pure logic and a view. The logic knows nothing about Vue, the view draws what the logic provides
- A game may only know `core` and `game-kit` (a package with Vue building blocks for games, see `tech-stack.md`), nothing of the platform
- A game package has three entries (see Package entries below): the manifest, the texts with the score display, and the module with a function `createRound({ level, seed, saved })`, a Vue component `View` that receives the round object and a how-to-play component. Scoring tests are not part of any entry (see below)
- `createRound` returns a round object with a fixed interface (`apply(move)`, `serialize()`, `result()`). The platform controls saving and round end through this interface. Pause and time are not part of it, they belong to the game (see Pause and Time)
- Scoring tests run directly against the logic (seed and move sequence produce the expected board, score and par). They are Vitest files in the game package (`src/scoring.<level>.test.ts`, one per level) and never ship in the bundle. `core` brings one shared test helper for all games. A repository check (`checks/scoring-tests.test.ts`) fails when a level in a manifest has no such file
- **One default `View` per game, and every level may bring its own.** A level without its own view uses the default of the game. The platform only chooses which component it loads and hands it the round. The own views live in the module (`views`, loaded on demand), not in the manifest, because the manifest is read for the game list without loading any view. The logic is unaffected, `createRound` receives the level anyway and may differ per level. **Not yet implemented:** the platform ignores `views` and always renders `View`
- The types live in `packages/core/src/contract.ts` (`Round`, `RoundResult`, `GameManifest`, `GameModule`). `core` has no Vue, so `GameModule` is generic over the view component type: `GameModule<TView>`, `game-kit` and the platform use Vue's `Component`. `playMoves(round, moves)` in `core` applies moves and returns `result()`, it is the helper for scoring tests. Sketch:

```ts
interface Round {
  apply(move: unknown): void
  serialize(): unknown        // goes into `state`
  result(): { roundEnd: 'won' | 'lost' | 'ended'; score: number[] } | null
}
interface GameModule<TView = unknown> {
  manifest: GameManifest
  createRound(p: { level: string; seed: number; saved?: unknown }): Round
  View: TView                 // default view, receives the round
  views?: Record<string, () => Promise<TView>> // optional, per level (not used by the platform yet)
  HowToPlay: TView            // rules and scoring content (game page)
}
```

### Package entries

- `.` (`src/manifest.ts`): the manifest, pure data. The platform reads it for the game list without loading any view
- `./texts` (`src/texts.ts`): `GameTexts` with `name`, `levelName(level)` and `formatScore(score)`. Loaded with the game list, so the start page and the result panel need no view
- `./module` (`src/module.ts`): `GameModule` with `createRound`, `View` and `HowToPlay`, loaded on demand when a game is opened
- The platform builds one registry from these entries (`apps/web/src/common/composables/game-registry.ts`). It has one entry per game folder, and the folder name must equal `manifest.id`. A missing entry or a wrong folder name throws when the registry is built. A module that declares another ID throws when it is loaded. Tests inject a fake registry instead of the real games
- The registry reads the files by path (`src/manifest.ts`, `src/texts.ts`, `src/module.ts`), the package `exports` declare the same entries for other packages

### Navigation

- Games have no routes of their own and do not use the History API. This includes memory and hash routers inside a game: a second router would have to be coordinated with the one of the platform for back key and back gesture, and the hash is already used by the platform for import links. The platform is the only place that handles back key and back gesture (abort confirmation as guard)
- Screens inside a running round are state of the view
- Choosing before the round (level, for fixed boards the number of the board), round end and the rules page belong to the platform
- If a game opens a layer of its own inside a round (for example a dialog), it reports this to the platform through a small service, so that back closes this layer first
- Leaving a running round (back key, links, abort) is confirmed by the platform through the leave guard. A game does not handle it
- Keys pressed inside a platform dialog or the open menu do not reach the game, the platform stops `keydown` there. A game's own window key handler should ignore form fields, modifier keys, repeated keys and events that are already `defaultPrevented` (Spillit does this in `keyboard.ts`)
- If a later game needs more, the rule is extended for that case. Taking freedoms away again would be more expensive

### Platform chrome (header and footer)

- The platform renders the one header and the one footer. `game-kit` provides `AppHeader` and `AppFooter`, each with the named slots `left`, `center` and `right`. The platform fills its own slots (app name and menu, gamer tag and abort or "Back to games")
- A game fills the bars through `ChromeSlot` with one of these names: `header-left`, `header-center`, `header-right`, `footer-left`, `footer-center`, `footer-right` (type `ChromeSlotName`, list `chromeSlotNames`, both in `game-kit`). The content is teleported into the matching bar. The target is looked up when rendered, so the slot may mount before or after the bar; without a target nothing is rendered
- Intended use: the time display of a game goes into `header-center`, its pause into `footer-center`. A game that has neither leaves the slots empty
- A game never knows the platform: it only names its slots and does not know what the other slots contain

### Pause and system interruptions

Two different things, only one of them is optional.

- **Pause by the player is optional and decided by the game.** A game that wants one shows a button, covers the board and stops its clock. A game without pause (for example a real-time game) offers nothing. Most games will have one
- `game-kit` provides `usePause()` and a `PauseCover` component. Convention: every game with a pause uses the cover, so the board cannot be studied while the time stands still. This is about fairness, not about enforcing anything (cheating protection stays out of scope), it is checked in review and not by the platform
- **Interruptions by the system cannot be refused** (app in the background, phone call, device locked, app killed). The platform only provides facts and a safety net:
  - it publishes the activity signal (foreground or background, framework-free in `core`)
  - it calls `serialize()` and saves the state when the app goes to the background
  - it restores the round on the next start through `saved`
- **What happens on return is the decision of the game:** continue (the default, the clock did not run in the meantime), pause itself, or end the round with a move (for example a real-time game that cannot continue)
- The round object does not learn about pause or activity, only the clock and the view do. This keeps the interface small
- The rules are not shown during a round. They are on the game page (see Platform chrome and How-to-play content). Whether a game may offer its rules from its own pause is not decided

### Time

- **The game measures time itself,** when it needs time at all. A game without a time score uses nothing of this
- `core` brings the active clock (framework-free): `createActiveClock(saved?)` with `elapsedMs()` and `serialize()`. It runs only while the game is active: it stops during pause and while the app is in the background (through the activity signal of the platform), so no game implements these cases itself
- The game puts the state of the clock into its own `serialize()` and hands it back to `createActiveClock` on resume, so a resumed round continues with the time played so far. The platform stores nothing about time
- Showing the time is the decision of the game. `game-kit` brings `useElapsed(clock)`, a composable that ticks reactively, for views that want to show it
- The logic gets the clock as a parameter (`{ elapsedMs(): number }`) and stays free of real time. `result()` has no time parameter. Scoring tests pass a fake clock (for example 93000 ms)
- A game may use the time during the round as well (for example a time limit), the clock is available at any moment

### How-to-play content

- The game delivers a Vue component `HowToPlay` with free content: text, headings, a small example board that shows a move. The platform shows it on the game page under the heading "Game rules" (the heading text comes from the platform). There is no dialog. The texts live in the language file of the game
- The content starts with the goal as one paragraph. The details and examples follow inside `HowToMore`, which renders a "More" button that turns into "Less" (`aria-expanded`, `aria-controls`). Collapsed on every visit, the hidden part is neither visible nor focusable. Without details there is no button. Labels are props, filled from the game's texts
- `game-kit` offers shared building blocks (`HowToHeading`, `HowToParagraph`, `HowToExample`, `HowToMore`) that games may use but do not have to, for a similar look

### Manifest

- Only what the platform needs, pure data and small: `id`, `symbol`, `gameVersion`, `scoringVersion`, `interfaceVersion`, the list of levels with their IDs (`a`, `b`, `c`) and the direction of every score position (`scoring: [{ key: 'points', better: 'higher' }, { key: 'deviation', better: 'lower' }]`)
- `symbol` is the name of an icon from the list that `game-kit` offers (the keys of `gameSymbols`, for example `grid-2x2` for Spillit). The platform turns the name into the icon for the tile and the game page. Pure data, nothing is loaded for it. A game cannot bring its own artwork this way
- **Level order:** the levels in the manifest are in ascending order. "Highest level" means the last one in that list that has a result (`highestLevelWithResult` in `core`). It is used for the tile on the start page. Without any result there is none
- The level letters say nothing about difficulty; the order is the only meaning the platform gives them
- The parameters of a level (grid size, number of colors) stay in the game logic, so the numbers exist in one place. The rule "if a parameter of a level changes, the scoring version goes up" stays with the logic and its scoring tests
- Display names (of the game and of the levels, for example "6×6 · 4 colors") come from the texts of the game, not from the manifest
- The three versions are integers, not texts. `gameVersion` and `interfaceVersion` start at 1, `scoringVersion` may be 0 until the first release of the app. Comparability depends only on `scoringVersion`, and for `gameVersion` traceability counts, not semantics
- **Not yet implemented:** the platform does not check `interfaceVersion` yet

### Showing a score

- **Order is generic, display is the game's.** The platform compares score values position by position with the `better` direction from the manifest (no game code needed, so import, merge and old scoring versions need none either). How a score looks is up to the game
- The `key` of each score position is also the text key of its label, taken from the language file of the game
- For the value itself the game provides `formatScore(score)` as part of `GameTexts` (for example "2 under par" instead of `-2`), in the `./texts` entry and separate from the view. The platform only calls it, for the result panel. Decided: a function, not text templates with parameters
- The start page tile still shows the first score value unformatted (see `architecture.md`, Open questions)

### Reporting moves and round end

- The platform wraps the round object. The view gets an object whose `apply` the platform intercepts: after every move the platform itself calls `serialize()` to save the state and `result()` to check for the end of the round
- The platform also calls `serialize()` and saves when the app goes to the background, so time between two moves is not lost either
- A game cannot forget to report, the view only calls `apply`. This also holds for per-level views
- Reason: saving and the result are the two things where mistakes would cost most. One place in the platform is easier to test than every single game

### Open-ended games ("End and score")

- The button belongs to the game: its view shows it (only if the game needs it), with its own wording and its own confirmation. The platform knows nothing about it
- Ending is a move for the logic: the button calls `round.apply({ type: 'end' })` (the game names the move itself), afterwards `result()` returns `ended`. The platform notices it through the wrapped `apply` like any other move
- No manifest field and no extra method. Scoring tests can include the end move in their move sequence
- The confirmation before ending uses the small service for layers of the game, so back closes it first

### Errors

- The platform catches errors: `createRound` runs in a try/catch, the view runs inside an error guard (`onErrorCaptured` on the play page). A failing module load takes the same path
- On an error the round is discarded, no result is created, the app shows a notice ("Something went wrong, the round was discarded", see `architecture.md`) and goes to the start page. Nothing is sent anywhere
- Saved states: the platform does not store rounds yet, so there is nothing to delete. When resuming a saved round is built, the same error path deletes its saved state. **Not yet implemented:** resuming and saving
- An unknown game or level in the URL is not an error of the game: the play page keeps its inline error with a link back and shows no notice
- A broken state can therefore never trap the app in a loop. The console helps during development, the scoring tests cover the logic

### Deferred until needed

- Fixed-board games (for example Sokoban): how the board numbers are offered as seed choice. Decided when the first such game is built
- Deep links into a game (game, level and seed in the URL, for example for group boards): owned by the platform router, never by games. Not part of the beta, decided together with groups (see `architecture.md`)

## Open

Nothing is open for the contract at the concept level. Details (exact type definitions of the clock, the activity signal and `usePause`, the service for layers of a game) are fixed when `packages/core` and `packages/game-kit` are written.
