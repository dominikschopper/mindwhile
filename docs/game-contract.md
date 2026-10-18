# Game contract (Mindwhile)

Status: draft, filled decision by decision. The contract is the interface between platform and game and the content of `packages/core`. Rules and reasons live in `architecture.md`, formats in `data-formats.md`, terms in `glossary.md`.

## Decided

### Shape

- A game is split into pure logic and a view. The logic knows nothing about Vue, the view draws what the logic provides
- A game may only know `core` and `game-kit` (a package with Vue building blocks for games, see `tech-stack.md`), nothing of the platform
- A game package exports a module with: a manifest, a function `createRound({ challenge, seed, saved })`, a Vue component `View` that receives the round object, and its scoring tests
- `createRound` returns a round object with a fixed interface (`apply(move)`, `serialize()`, `result()`). The platform controls saving and round end through this interface. Pause and time are not part of it, they belong to the game (see Pause and Time)
- Scoring tests run directly against the logic (seed and move sequence produce the expected board, score and par). `core` brings one shared test runner for all games
- **One default `View` per game, and every challenge may bring its own.** A challenge without its own view uses the default of the game. The platform only chooses which component it loads and hands it the round. The own views live in the module (`views`, loaded on demand), not in the manifest, because the manifest is read for the game list without loading any view. The logic is unaffected, `createRound` receives the challenge anyway and may differ per challenge
- Sketch (concept, not built):

```ts
interface Round {
  apply(move: unknown): void
  serialize(): unknown        // goes into `state`
  result(): { roundEnd: 'won' | 'lost' | 'ended'; score: number[] } | null
}
interface GameModule {
  manifest: GameManifest
  createRound(p: { challenge: string; seed: number; saved?: unknown }): Round
  View: Component             // default view, receives the round
  views?: Record<string, () => Promise<Component>> // optional, per challenge
  HowToPlay: Component        // rules and scoring dialog content
  scoringTests: ScoringTest[] // seed + moves -> expected score and par
}
```

### Navigation

- Games have no routes of their own and do not use the History API. This includes memory and hash routers inside a game: a second router would have to be coordinated with the one of the platform for back key and back gesture, and the hash is already used by the platform for import links. The platform is the only place that handles back key and back gesture (abort confirmation as guard)
- Screens inside a running round are state of the view
- Choosing before the round (challenge, for fixed boards the number of the board), round end and the how-to-play dialog belong to the platform
- If a game opens a layer of its own inside a round (for example a dialog), it reports this to the platform through a small service, so that back closes this layer first, like the how-to-play dialog
- If a later game needs more, the rule is extended for that case. Taking freedoms away again would be more expensive

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
- During a round the how-to-play dialog is reachable if the game offers it (for example from its pause screen), through the small service for layers. The dialog lies over the cover, as described in `architecture.md`

### Time

- **The game measures time itself,** when it needs time at all. A game without a time score uses nothing of this
- `core` brings the active clock (framework-free): `createActiveClock(saved?)` with `elapsedMs()` and `serialize()`. It runs only while the game is active: it stops during pause and while the app is in the background (through the activity signal of the platform), so no game implements these cases itself
- The game puts the state of the clock into its own `serialize()` and hands it back to `createActiveClock` on resume, so a resumed round continues with the time played so far. The platform stores nothing about time
- Showing the time is the decision of the game. `game-kit` brings `useElapsed(clock)`, a composable that ticks reactively, for views that want to show it
- The logic gets the clock as a parameter (`{ elapsedMs(): number }`) and stays free of real time. `result()` has no time parameter. Scoring tests pass a fake clock (for example 93000 ms)
- A game may use the time during the round as well (for example a time limit), the clock is available at any moment

### How-to-play dialog

- The game delivers a Vue component `HowToPlay` with free content: text, headings, a small example board that shows a move. The platform puts it into its dialog (frame, scrolling, closing, "Start game" button on the first start). The texts live in the language file of the game
- `game-kit` offers shared building blocks (heading, paragraph, example box) that games may use but do not have to, for a similar look

### Manifest

- Only what the platform needs, pure data and small: `id`, `gameVersion`, `scoringVersion`, `interfaceVersion`, the list of challenges with their IDs (`a`, `b`, `c`) and the direction of every score position (`scoring: [{ key: 'deviation', better: 'lower' }]`)
- The parameters of a challenge (grid size, number of colors) stay in the game logic, so the numbers exist in one place. The rule "if a parameter of a challenge changes, the scoring version goes up" stays with the logic and its scoring tests
- Display names (of the game and of the challenges, for example "6×6 · 4 colors") come from the texts of the game, not from the manifest
- The three versions are integers starting at 1, not texts. Comparability depends only on `scoringVersion`, and for `gameVersion` traceability counts, not semantics

### Reporting moves and round end

- The platform wraps the round object. The view gets an object whose `apply` the platform intercepts: after every move the platform itself calls `serialize()` to save the state and `result()` to check for the end of the round
- The platform also calls `serialize()` and saves when the app goes to the background, so time between two moves is not lost either
- A game cannot forget to report, the view only calls `apply`. This also holds for per-challenge views
- Reason: saving and the result are the two things where mistakes would cost most. One place in the platform is easier to test than every single game

### Open-ended games ("End and score")

- The button belongs to the game: its view shows it (only if the game needs it), with its own wording and its own confirmation. The platform knows nothing about it
- Ending is a move for the logic: the button calls `round.apply({ type: 'end' })` (the game names the move itself), afterwards `result()` returns `ended`. The platform notices it through the wrapped `apply` like any other move
- No manifest field and no extra method. Scoring tests can include the end move in their move sequence
- The confirmation before ending uses the small service for layers of the game, so back closes it first

### Errors

- The platform catches errors: `createRound` and the view run inside an error guard (also while resuming a saved round)
- On an error the app shows a hint ("Something went wrong, the round was discarded"), deletes the saved state, creates no result and returns to the game selection. Nothing is sent anywhere
- A broken state can therefore never trap the app in a loop. The console helps during development, the scoring tests cover the logic

### Deferred until needed

- Fixed-board games (for example Sokoban): how the board numbers are offered as seed choice. Decided when the first such game is built
- Deep links into a game (game, challenge and seed in the URL, for example for group boards): owned by the platform router, never by games. Not part of the beta, decided together with groups (see `architecture.md`)

## Open

Nothing is open for the contract at the concept level. Details (exact type definitions of the clock, the activity signal and `usePause`, the service for layers of a game) are fixed when `packages/core` and `packages/game-kit` are written.
