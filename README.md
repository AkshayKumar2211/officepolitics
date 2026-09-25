# Office Politics

A browser-based multiplayer social deduction game built from `office-politics-game-design.md`. Player sessions and live matches are stored in PostgreSQL using Prisma ORM.

## Run

Requires Node.js 22.12 or newer and a PostgreSQL database.

Set `DATABASE_URL` in `.env` first (see below), then:

```sh
npm install
npm run db:deploy
npm start
```

Open **http://localhost:3000**. To choose another port, run `PORT=8080 npm start`.

**Play alone:** click **Start solo practice**, enter your name, and choose Office Staff, Political Operative, or a random faction. Five simulated colleagues join automatically. Use **Next phase** to move at your own pace.

**Play with friends:** create a room, share its six-character code, and invite **5–10 players**. Each player enters a name and readies up; the host starts when everyone is ready. For a local demonstration, open five separate tabs and join the same room with different names. Each tab has its own session. On a local network, friends can open `http://YOUR-COMPUTER-IP:3000` if your firewall allows it. A room code only works for players connected to the same running server.

`npm run dev` restarts the server after source changes; saved rooms resume when a player reconnects.

## Environment and player saves

Set `DATABASE_URL` in `.env` to your PostgreSQL connection string. Your existing URL is preserved. For a new checkout, copy `.env.example` to `.env` and replace its placeholder. Existing environment variables take precedence.

| Variable | Value | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Your provider’s PostgreSQL URL | Required Prisma database connection; includes credentials. |
| `PORT` | `3000` | Optional HTTP port. |
| `HOST` | `0.0.0.0` | Optional listening address; use `127.0.0.1` for local-only access. |

`npm install` generates Prisma Client. Run `npm run db:deploy` to apply committed migrations; it adds the `OfficePoliticsSnapshot` table. `npm run db:generate` regenerates the client after schema changes, and `npm run db:studio` opens the database browser locally.

Prisma stores rooms, player identities, reconnect tokens, messages, positions, roles, and match progress as a private JSON snapshot in PostgreSQL. Changed state is checkpointed once per second; normal shutdown awaits a final save. A sudden crash may lose the latest unsaved interval. Saves are serialized and failed writes retry. Database startup errors stop the server rather than silently falling back to empty or local saves.

Run one game server per database: the live simulation and event streams remain in memory, so multiple server instances are not supported. Treat database contents as private: they include guest credentials and hidden roles. `.env` stays excluded from Git. `SAVE_DATA`, `DATA_FILE`, and `SAVE_INTERVAL_MS` are no longer used; no local JSON save file is written. Old files in `data/` are left untouched as backups and are not imported automatically.

Players return using their browser’s saved session token. This is guest-session persistence, not an account/password system or cross-device login. Lifetime career stats and notebooks remain in browser localStorage. After a server restart, saved rooms pause until someone reconnects. Empty rooms normally expire after one hour; explicitly leaving a practice game deletes that room from the next checkpoint.

## Explore and talk

- Move across the shared 12 × 8 office with WASD, arrow keys, or the on-screen direction buttons. Desks block movement. Movement is available in the lobby, briefing, work, and final screen; meetings keep everyone seated.
- Chat with the whole office using the message box. Text is escaped, messages are limited to 240 characters, and sending has a 1.5-second cooldown. Spectators read only until the match ends. Roster mute controls also hide office-chat messages.
- Send six emoji reactions that appear over your avatar. Simulated colleagues wander during briefing and work.
- Race for three coffee cups each workday. Walk onto a cup during work to collect it and add 2% company health. Each cup can be claimed once, and collected totals appear beside the movement controls.

## Project content

Game content and visuals ship with this project. PostgreSQL is the only external runtime service; no AI API key is needed.

- `content.js` defines roles, tasks, projects, events, and phase durations.
- `game.js` owns rules, simulated colleagues, and player actions.
- `public/app.js` and `public/styles.css` define the interface.
- `prisma/schema.prisma`, `database.js`, and `storage.js` define database access and persistence.
- Browser career stats and preferences use localStorage; live multiplayer rooms use Prisma/PostgreSQL checkpoints.

The interface uses large text throughout, 56–58px primary controls, spacious cards, larger meeting messages, and enlarged task dialogs. Layouts stack on smaller screens instead of shrinking the text.

## What is implemented

- Private rooms, configurable capacity, readiness, host migration, and leave controls.
- Server-assigned private factions and public job designations, with the brief’s faction counts.
- Timed briefing, work, incident, discussion, ballot, appeal, and resolution phases.
- **24 validated task templates**, including three- and four-step ordering puzzles, prioritization, simple arithmetic, scheduling, and review choices. Three personal tasks rotate each workday.
- **Six rotating projects and six office events** that change task, completed-desk, and file-recovery rewards.
- A shared project milestone: twice the active player count in contributions earns +8% progress and an influence token for every active colleague.
- Private daily objectives: Staff clears all three tasks; Operatives complete a task and use sabotage. Completing an objective earns one influence token, capped at two held.
- **Eight operative actions**, limited to one per workday, including Flood the Inbox, Book a Ghost Meeting, and Scramble the Forecast; shared file recovery and ambiguous event-based evidence.
- Twelve discussion prompts, one public colleague recommendation per player per meeting, and per-browser mute controls. Room-wide free-text chat is also available, limited to 240 characters with a cooldown.
- A private notebook with autosaved notes and pinned evidence across workdays. Notes are kept separately for each player and match on the device.
- Private simultaneous ballots, strict-majority accusations, HR appeals, two lives, and spectator mode.
- Promotions, influence tokens, and one additional audit per match.
- Staff victory, the two-survivor ending and its exact closing message, and abandoned matches.
- Reconnect to the same seat within 30 seconds. After that, disconnected players become spectators; empty lobby seats are removed.
- **Solo practice** with five simulated colleagues, selectable faction, shorter timers, and manual phase advancement.
- **Ten career achievements**, lifetime XP levels, the last 20 match summaries, and a JSON career export.
- Responsive desktop/mobile layouts, keyboard task controls, and modal focus trapping.

Multiplayer follows the original phase durations. Practice uses 8/60/8/25/15/20/8-second briefing/work/incident/meeting/vote/appeal/resolution phases, and its host may advance early. Before advancing, simulated colleagues finish their pending actions for the current phase. Practice rematches return to a lobby with simulated colleagues already ready.

Simulated colleagues are built-in rule-based game logic, not an external AI service. They complete their own tasks, use their own operative actions, and discuss with preset prompts. Their votes use public workstation evidence and public recommendations, never hidden factions or other players’ private ballots. They coordinate on a candidate, can accuse innocent staff, and judge appeals without using faction knowledge. They are intended for learning the mechanics, not to simulate the full range of human social deduction.

Practice rooms cannot be joined by other humans. Leaving a practice room removes it and its simulated players. A disconnect holds the human seat for 30 seconds, after which the match is abandoned.

Depending on votes, multiplayer can run longer than the estimated 15–25 minutes.

## Local storage and live state

The browser saves these keys in **localStorage**:

| Key | Data |
| --- | --- |
| `op-name` | Most recently entered name |
| `op-session` | Last room code and opaque reconnect token |
| `op-stats` | Career totals, XP, achievement progress, recent match history, and processed match IDs |
| `op-notes` | Private text and pinned clues for the most recent 20 player/match combinations |
| `op-muted` | Muted player IDs |

`sessionStorage` holds the current tab’s reconnect token, so separate tabs can be different players. Reloading a tab reconnects automatically. The overview also offers a return-to-last-office button. Career totals are saved when a match ends while the player is connected, or when reconnecting to the completed match. A processed-match list prevents refreshes from awarding the same result twice. Practice and multiplayer both contribute to local career totals and are labeled separately in history. Career levels are independent of in-match promotion ranks. No individual victory is awarded for the two-survivor ending. Browser storage can be cleared with the browser’s site-data controls.

The Node server owns live rooms, hidden roles, timers, task validation, votes, lives, and outcomes in memory with periodic PostgreSQL snapshots. Restarting restores saved matches; their timers pause until the first player reconnects, then other players have the usual 30-second reconnect window. Hidden information is never stored in shared browser storage or sent in another player’s state. All factions are revealed on the final screen. Live matches survive restarts through the configured PostgreSQL database. Hosting it online would also require HTTPS and deployment-level resource limits; it uses the PostgreSQL database configured in `.env`.

## Implementation

- `content.js`: all built-in tasks, answers, roles, actions, prompts, projects, events, and durations. This file is server-only so task answers are not shipped to the browser.
- `game.js`: faction rules, state machine, rewards, simulated-colleague logic, and per-player state filtering.
- `server.js`: built-in Node HTTP server, authenticated action requests, personalized Server-Sent Events streams, and scheduled Prisma checkpoints.
- `database.js`, `storage.js`, `prisma/`: PostgreSQL adapter, serialized save/restore, schema, and migrations.
- `public/`: plain JavaScript, CSS, and an inline SVG office illustration. No external assets or font requests.
- `public/progress.js`: local career migration, XP, match history, and achievement definitions.
- `test/game.test.js` and `test/expansion.test.js`: state-machine and career tests using Node’s built-in runner.

Server-Sent Events synchronize server-to-browser state; authenticated HTTP requests carry actions back. This provides the same authoritative multiplayer model without a WebSocket dependency. Guest tokens identify a player and should be treated as private session credentials.

## Verify

```sh
npm test
```

Tests cover faction counts and privacy, readiness and host checks, all task definitions, task validation, sabotage limits, voting and promotions, appeals and eliminations, ending precedence, reconnects, timers, influence, abandonment, rematches, practice behavior, public recommendations, daily modifiers, milestone rewards, objectives, and career migration/deduplication.
