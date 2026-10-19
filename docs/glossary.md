# Glossary

Status: draft. Every term used in the documents has exactly one English name for code, file formats and commit scopes. Rules live in `architecture.md`, conventions in `tech-stack.md`.

Spelling in code: identifiers in `camelCase`, types in `PascalCase`, folders and files in `kebab-case`. This also applies to keys in JSON formats.

## Game and scoring

| Term (code name) | Meaning |
|---|---|
| game (`game`, `gameId`) | One game of the collection, for example Spillit. It never means a single board or round |
| round (`round`) | One run of a game from start to round end |
| board (`board`, state at the start: `startBoard`) | The concrete playing field of a round, determined by `seed` and `challenge` |
| seed (`seed`) | Identifier from which the start board is generated reproducibly. For games with fixed boards (for example Sokoban) the seed selects the board from the fixed list, there is no second name for the identifier |
| challenge (`challenge`, values `a`, `b`, `c`, more later) | A fixed variant of a game with its own parameters, for example grid size and number of colors in Spillit. The letters are neutral, permanent IDs and say nothing about difficulty. The display name comes from the texts of the game. A challenge ID is never reassigned |
| result (`result`) | Result of a finished round |
| score values (`scoreValues`) | Ordered list of integers by which results are compared. The direction of each position (`higher` or `lower` is better) is declared in the game manifest, not in the result |
| best result (`bestResult`) | Best result per game, challenge and scoring version |
| par (`par`) | Reference value of a board (in Spillit: the moves of the greedy method) |
| deviation (`deviation`) | Moves minus par |
| points (`points`) | Spillit score value derived from moves and par (`basePoints * par / moves`, rounded down to tens), higher is better |
| round end (`roundEnd` with state `won`, `lost` or `ended`) | Won, lost or ended (open-ended games) |
| abort (`abort`) | Leaving a round without a result being created |
| pause (`pause`) | Round stopped by the player, optional and decided by the game. Not the same as an interruption by the system |
| interruption | The app goes to the background or is stopped by the system. Cannot be refused, the platform saves the state |
| merge rule (`mergeRule`) | One entry per player and board, the better one wins |
| scoring test (`scoringTest`) | Fixed test case from seed and move sequence with expected board, score and par |

## Versions

| Term (code name) | Meaning |
|---|---|
| interface version (`interfaceVersion`) | Version of the contract between platform and game |
| game version (`gameVersion`) | Version of a game package |
| data format version (`dataFormatVersion`) | Version of profile, saved states and results |
| scoring version (`scoringVersion`) | Goes up only when what a score means changes |

## Profile

| Term (code name) | Meaning |
|---|---|
| profile (`profile`) | Gamer tag, symbol, ID and best results of a player on the device |
| player ID (`playerId`) | Random local key |
| gamer tag (`gamerTag`) | Display name |
| time of the tag change (`gamerTagChangedAt`) | Decides which tag applies when the ID is the same |
| symbol (`gamerSymbol`) | Separate field next to the tag |
| backup, export (`export`) | Output a profile as a file, QR or link |
| restore, import (`import`) | Take over a profile from a file, QR or link and merge it |

## Platform

| Term (code name) | Meaning |
|---|---|
| game contract (`GameContract`) | Interface that every game has to fulfill |
| game manifest (`GameManifest`) | Central description of a game (ID, versions, challenges, scoring type) |
| how-to-play dialog (`howToPlay`) | Dialog with the rules and scoring of a game. The game delivers the content as a component (`HowToPlay`) |
| game module (`GameModule`) | What a game package exports: manifest, `createRound`, default view, optional views per challenge, how-to-play component. Scoring tests are Vitest files next to it, not part of the module |
| round object (`Round`) | Pure logic of a running round (`apply`, `serialize`, `result`), wrapped by the platform |
| active time (`elapsedMs`) | Play time without pause and background, measured by the game with the active clock |
| active clock (`ActiveClock`, `createActiveClock`) | Framework-free clock in `core` that stops during pause and in the background |
| activity signal (`activity`) | Published by the platform: app in the foreground or background. The clock and games listen to it |
| game kit (`game-kit`) | Package with Vue building blocks for games: `usePause`, `PauseCover`, `useElapsed`, how-to-play building blocks |
| envelope (`app`, `fmtv`, `kind`) | Outer layer of every export, QR and link that tells the reader what it holds |
| game selection (`game-selection`) | Overview of the games |
| news (`news`, `news.json`) | File with entries per version, types `new`, `improved`, `fixed` |
| update activation (`updateActivation`) | Moment at which a downloaded complete state becomes active |
| group (`group`) | 2 to 10 people comparing the same board |
| daily (`daily`) | Board with a fixed seed for one day |

## Names (working titles, until conflicts are found)

| What | Display name | Name in code |
|---|---|---|
| Platform | Mindwhile | repository `mindwhile` |
| First game | Spillit | game ID `spill-it`, package `@mindwhile/game-spill-it`. Spillit is our version of the classic flood-fill game |

Display names live in the language files. The game ID follows the working title `spill-it`, so a later rename of the game would also touch the ID, stored results and the package name, and is decided deliberately.

## Open

- **Avoid `level`:** In conversation "level" was used for challenge and for board or round. In code we avoid `level` entirely: the challenge is `challenge`, a run is `round`, the playing field is `board`, its identifier is `seed`
- **Merge:** "Merge" is the working title of a game and also the rule for combining data. The game keeps its working title as package name until its final name exists, the rule is called `mergeRule` in code
