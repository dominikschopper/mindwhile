# Architecture (Mindwhile)

Concept level: principles, contracts and rules that hold permanently. Technology decisions live in `tech-stack.md`, the exact data formats in `data-formats.md`, the interface between platform and game in `game-contract.md`, terms and their code names in `glossary.md`.

## Guardrails (not negotiable)

- No tracking, no ads
- Minimal running costs
- No chat
- Maintenance-free: weeks without intervention must be possible, and an outage must never affect the games themselves
- Offline-first: everything essential works without a network

## Core decisions

| Topic | Decision |
|---|---|
| Scoring | Best results per game, no overall ranking |
| Groups | 2 to 10 people, asynchronous (same board via seed, compare afterwards; for games with fixed boards the seed is the number of the board) |
| Group lifetime | per game or board |
| Connecting and sharing | via QR or link, also through third-party messengers as a plain transport |
| Cheating | no protection, handled on the social level |
| Identity | Gamer tag (automatic default, changeable) plus symbol, plus a random player ID. The profile lives on the device and can be moved by export. On first start a short hint is enough, there is no mandatory onboarding |
| Backend | not part of the start, but not ruled out. If needed later: managed, optional, only for global features |
| Games | Packages from our own build, no loading from third-party sources at runtime |
| Offline | All games are cached up front at install time |
| Language | English only at the start, language switching later. All texts are externalized from the beginning (the word lists for default tags stay English) |

## Responsibilities of platform and game

| Area | Platform | Game |
|---|---|---|
| Game list | start page tiles: symbol, name and the best result of the highest challenge with a result (texts from the game) | delivers texts, manifest and symbol (name of an icon) |
| Identity and data | gamer tag, symbol, ID, best results, export and import, merge | nothing |
| Routing | the only router, back key and back gesture, abort confirmation | no routes of its own, screens are view state |
| Rounds | frame, saves the state (after every move and when going to the background), restores it, reports the round end | logic, `apply`, `serialize`, `result`, challenges, generator, par |
| Scoring | stores and compares score values | computes score values, scoring tests |
| Time | publishes the activity signal | measures time with the clock from `core`, shows it if it wants |
| Pause | detects interruptions, safety net | optional pause with `PauseCover`, reaction on return |
| Updates, news | service worker, activation rules, news | nothing |
| Help | game page with the heading "Game rules" and the "More" toggle | content (`HowToPlay`: goal first, details inside `HowToMore`) |
| Chrome (header, footer) | renders both bars, fills their own slots, menu, gamer tag, abort with confirmation, "Back to games" | fills its slots (time in the header center, pause in the footer center) through `ChromeSlot`, never knows the platform |

Both sides share `core` (contract, types, clock, activity signal) and `game-kit` (Vue building blocks for games). A game knows nothing of the platform.

## Platform shell

Routes (only the platform router): `/` start page with the tiles of all games, `/games/:id` game page, `/play/:gameId/:challenge` round, `/settings` settings.

- **Header** (sticky, full-width bar, content in the centered column): app name (link to the start page) and a menu button. The menu lists Settings and Language (disabled, with a hint that more languages follow). Keyboard: Escape closes it and focus returns to the button
- **Footer** (sticky, same layout): during a round the gamer tag (left, a fixed placeholder until the profile exists), the game's pause (center, optional) and abort (right). Abort asks for confirmation; a confirmed abort discards the round and opens the game page, "Keep playing" keeps the round running. Outside a round and after the round end the footer shows "Back to games" (start page) instead of pause and abort. The gamer tag is shown everywhere
- **Game page** `/games/:id`: symbol and name, a challenge select with a Go button, the best result of the selected challenge ("—" while there is none), the heading "Game rules" and the rules of the game (`HowToPlay`). The selected challenge is remembered for the session
- **Settings** `/settings`: color scheme (system, light, dark). The choice is not persisted yet
- **Width:** the content column is at most 960px and centered; on narrow screens it takes 98% of the width (1% spacing on both sides)
- A game that has no time display or no pause leaves the header center or footer center empty without layout shift

## Expansion stages (draft)

| Capability | Stage 0 (no backend) | Stage 1 | Stage 2 (backend) |
|---|---|---|---|
| Scores | local only | share in a group via QR/link | global list |
| Identity | Gamer tag plus symbol, profile on the device, movable by export | | optional account |
| Groups | nearby, device to device | group code | remote groups |
| News | static file, fetched on open (pull) | | |
| Updates | service worker, controlled activation | | |

News and updates need no backend of their own, only static hosting.

## Formats (fix early, hard to change later)

The exact keys, types, envelope, limits and transport are fixed in `data-formats.md`. This section keeps the principles.

- **Result:** versioned, contains game, game version, scoring version, seed, challenge, score values, player ID
- **Score values:** A result has no single score but an ordered list of integers. Each position has a direction (more or less is better), which is declared in the game manifest per scoring version and not stored in the result (see `data-formats.md`). Comparison goes in order, and on a tie the next value decides. Raw values are stored and transferred, no decimals. Changing the values or their order is a scoring change (the scoring version goes up)
  - Merge: highest tile (more is better), then moves until that tile was first reached (fewer is better). The classic point sum is only displayed and not used for ranking
- **Merge rule:** exactly one entry per player and board, the order of arrival does not matter
- **Best result:** the best result per game, challenge and scoring version (free play). For daily and group boards additionally the result per seed
- **Storage format:** with a version number and a migration path from the start
- **Player ID:** a random local key, the gamer tag is display only. A later backend can use the same ID

## Profile and backup

- **Gamer tag:** Assigned automatically by default (see First start), freely changeable by the user. Identity is the random player ID, the tag is display only and does not have to be unique. The tag is at most 16 characters long (letters, digits, spaces, hyphen, no emojis, the symbol is a separate field). Default tags always fit because adjectives and animals are at most 7 characters long
- **Symbol:** A separate field next to the tag, helps tell identical tags apart in group lists. Picked randomly on first start from a fixed set of about two dozen shapes that differ in form and not only in color (color-blind friendly). Changeable in the profile menu
- **First start:** Nothing is mandatory. The app creates a default profile (tag and ID automatic) and the user can play right away. The default tag is built from an adjective and an animal (100 entries each, maintained by hand and checked for unfortunate combinations), for example "Swift Fox". The lists are English only and stay so after a later language switch. The finished text is stored, not the list position. Changing the tag, backup and restore are in the profile menu and always reachable
- **Backup:** An export file is the basis (tag, symbol, ID, time of the last tag change, own best results, later also own results per board for daily and group boards; no group states of other players, those come from sharing again), offered through the system share menu. Additionally QR or link from device to device (data in the part after the `#`, which never goes to a server). File, QR and link use the same compact format (versioned JSON, compressed). If a profile does not fit into a QR code, the app offers only the file for that profile and says so openly
- **Restore on a device that already has a profile:** Merge. Best results are merged per game, challenge and scoring version, the better value wins (merge rule). The player ID comes from the file, the local ID is dropped. The gamer tag also comes from the file if the IDs differ. With the same ID the tag with the more recent change time wins (the profile stores it). The user sees only the tag, the ID is an internal key. Before applying, a single confirmation dialog shows what will happen (tag, number of best results, "Your current profile will be merged with this one"). No wizard. Results that were already shared in groups under the old local ID stay there as a separate player
- **The same player ID on several devices is intended.** The ID is pure randomness and contains nothing about the device (no fingerprint). Until the first import, two devices are two players. Import overwrites the local ID with the one from the file and never creates a new one. This way devices can be synchronized as often as wanted without orphaned IDs staying behind in group lists
- No automatic file writing as a basis, because only Chrome and Edge on desktop can do that. Conceivable later as a desktop extra
- **Installation:** A one-time hint after the first finished round with instructions (iOS: Share, then Add to Home Screen; Android: install button), afterwards only in the profile menu. In addition the app requests persistent storage in the background without asking the user. Reason: Safari on iOS may delete data of sites that have not been visited for a long time, and installing protects best against that
- **Backup reminder:** only if something important changed since the last backup (new best result, new tag)
  - On app start: a hint to back up
  - When switching to the game selection: a hint on the first two switches, on the next three the export button pulses, then nothing more
  - After a backup the counting starts over. The app cannot tell whether saving in the share menu really happened, so the counter counts as reset from the moment of tapping
  - With reduced motion enabled, a calm highlight instead of pulsing

## Round flow

- A game always runs exactly one round (one board). While a round is running, no other game can be started
- The rules of the game are on its game page (see Platform shell), not during a round. At round end the result offers "Next round", the footer offers "Back to games"
- Leaving a round is only possible after the round end (won, lost or ended) or after a confirmed abort ("Abort round? Progress will be lost"). An abort opens the game page, "Back to games" the start page
- An abort discards the state, neither a result nor a best result is created
- The device's back gesture and back key trigger the same abort confirmation as the back button
- Daily and group boards may be played any number of times for now, the better value counts (merge rule)
- A pause by the player is optional and decided by the game (a game without pause is allowed, for example a real-time game). Games with a pause cover the board while paused
- An interruption by the system (app in the background, phone call, device locked) cannot be refused. The platform saves the state when the app goes to the background and resumes the round on the next open. What happens on return (continue, pause, end with a move) is decided by the game
- For this the platform stores the state of the running round (at most one per device) with the game version and data format version
- Time scores count only active play time. The game measures it itself with a clock from `core` that stops during pause and while the app is in the background. The platform only publishes the activity signal (see `game-contract.md` and `data-formats.md`)
- Every game reports the round end to the platform (won, lost, ended). This is part of the game contract
- Open-ended games (for example Merge) end when no move is possible any more, or via "End and score"

## Game package and versions

The interface between platform and game (module shape, navigation, pause, time, reporting, errors) is described in `game-contract.md`.

**Delivery:**
- Every game is a package of its own with a hash in the file name, fully cached up front
- An update is always one complete state of platform and all games, never a partial update. Thanks to the hashes the download is still per game

**Four version levels:**
1. **Interface version:** Which contract between platform and game was the game built against? If it does not match, "Please reload the app" appears instead of a crash
2. **Game version:** Stored in the manifest and in every result, serves traceability. Bug fixes and UX improvements change it without affecting the comparability of scores
3. **Data format version:** For profile, saved states and results, with a migration path
4. **Scoring version (per game):** A number of its own that only goes up when what a score means changes: generator (the same seed must produce the same board), scoring formula, par calculation or the parameters of a challenge (for example grid size and number of colors). Scores are comparable exactly when game, challenge and scoring version match

**Game manifest (central description per game):** ID, game version, scoring version, interface version, challenges (their IDs only, the parameters stay in the game logic), the direction of every score position. Display names are not part of the manifest but live in the texts of the game

**How-to-play content:** Every game ships its rules and scoring (for example how par is calculated in Spillit and why the deviation can be negative) as a `HowToPlay` component. It is part of the game contract, its texts live in the language file of the game. The content starts with the goal as one paragraph; the details and examples sit inside `HowToMore` (collapsed by default, a "More" button that turns into "Less").

The platform shows it on the game page under the heading "Game rules" (see Platform shell). There is no dialog around it. Round end offers "Next round" and "Back to games".

**Rules:**
- Code: all or nothing, partial updates never become active
- Data: the new platform always reads old data formats (migration on start)
- A saved round state is only resumed with the game version it was created with. An update that would make it unusable waits (see Update activation)
- When the scoring version goes up, old best results are kept but shown separately ("Best result from scoring 1"), the new list starts empty
- Without a scoring change (bug fix, UX) all best results stay comparable and in the same list
- **Scoring tests are mandatory:** Every game ships fixed test cases (seed and move sequence produce the expected board, score and par). Without them a game does not count as finished. If a test case fails, the scoring version must be raised deliberately or the change must be reverted
- Interface changes should be additive only if possible (new optional field), an incompatible change only as a deliberate major version with migration and a note in the news

## Update activation

- A new state is downloaded completely in the background and normally becomes active when the user switches to the game selection after a game (automatically, without a dialog). Further moments (start, return to the foreground) are listed below
- Never during a running round, never with a half-loaded state. A paused or interrupted round does not count as running as long as its state is compatible with the new one
- Because the game selection is only reachable after round end or a confirmed abort, an update never hits a running round
- After activation a short hint "New in version X" appears, taken from the news file
- Interrupted round on start: If the saved state is compatible, the app updates and resumes the round. With an incompatible game version the update waits until the round is finished or aborted. There is no upper limit for now
- When someone returns to the foreground after a longer pause, this also counts as a moment for the update, but only between two rounds, never in the middle of a game
- Several open windows: Once one has updated, the others show "Please reload"
- Failed download: Only a completely loaded state is activated, the next attempt runs on the next open

## Groups with different app versions

- Values are compared only for the same game, the same challenge and the same scoring version. With a different scoring version the app asks for an update and **refuses to compare values** until both sides have the same scoring version
- Different app or game versions without a scoring change are no obstacle
- Results of unknown newer formats are not merged but rejected ("The sender uses a newer version")
- Results of different scoring versions never appear in the same list

## News and changelog

- **News file:** a JSON file `news.json` with all versions. Each version has a number and a date, each entry has a type (`new`, `improved`, `fixed`) and a text, the text exists per language (English only at first). The build validates the format, the app fetches the file on open and shows "New in version X" for everything since the last version seen
- **Two levels:** A technical changelog (`CHANGELOG.md`, generated from Conventional Commits) stays in the repository and is not shipped, players never see it. There are no special rules for commit messages, only the standard types, the commit scopes are game ID or feature
- **Draft from the changelog:** At release a draft of the news is generated from the changelog, containing only entries that matter to players: `feat` becomes `new`, `fix` becomes `fixed`, `perf` becomes `improved`. Refactorings, tests, build and documentation stay out. Usability improvements that have another commit type are assigned by hand when writing
- The news are written by hand from the draft at release time, phrased for humans. The build validates the format and reports when entries are missing for the new version

## Open architecture questions

- **Comparability of score values in free play:** Define per game that the values do not depend on the random board. Decided for Spillit (points from the ratio of par to moves, deviation from par as tie-break), still open for Merge and the other games
- **Game list display:** the start page tile shows the best result of the highest challenge with a result, with the challenge name as a small label. Still open is the exact shape of the value display: function versus text templates with parameters (see `game-contract.md`). The tile shows the stored value unformatted for now, and "—" until storage exists
- **Game-owned data in the export:** whether a game may keep own small data (settings) that goes into the export, for example as an opaque slot per game with a size limit. Not needed by any game yet, not decided
- **Deep links:** A URL scheme that opens a game with challenge and seed (for group boards) belongs to the platform router. Deferred, not part of the beta, decided together with groups. Games never route themselves
- Limit for QR codes: size of a profile in a QR code, measured when QR is built (after the beta, see `data-formats.md`)
