# Office Politics

A browser-based multiplayer social deduction game built from `office-politics-game-design.md`. No install step, accounts, database, or third-party dependencies are required.

## Run

Requires Node.js 20 or newer.

```sh
npm start
```

Open **http://localhost:3000**. To choose another port, run `PORT=8080 npm start`.

**Play alone:** click **Start solo practice**, enter your name, and choose Office Staff, Political Operative, or a random faction. Five simulated colleagues join automatically. Use **Next phase** to move at your own pace.

**Play with friends:** create a room, share its six-character code, and invite **5–10 players**. Each player enters a name and readies up; the host starts when everyone is ready. For a local demonstration, open five separate tabs and join the same room with different names. Each tab has its own session. On a local network, friends can open `http://YOUR-COMPUTER-IP:3000` if your firewall allows it. A room code only works for players connected to the same running server.

`npm run dev` restarts the server after source changes; doing so clears live rooms.

## Self-contained, no database

All game content and assets ship in this folder. There are no database drivers, cloud services, API keys, package downloads, external fonts, or hosted images to configure. The browser and the local Node.js process are all you need.

- Edit roles, all 24 tasks and their answers, eight action names, six projects, six office events, promotion ranks, and phase durations in `content.js`. Game rules and simulated-colleague behavior live in `game.js`.
- Edit screen copy, quick-chat presentation, and the inline office illustration in `public/app.js`.
- Edit colors, typography, and responsive layouts in `public/styles.css`.
- Browser career stats and preferences use localStorage; live multiplayer rooms use server memory.

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
- Twelve discussion prompts, one public colleague recommendation per player per meeting, and per-browser mute controls. There is no unmoderated free-text chat.
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

The Node server owns live rooms, hidden roles, timers, task validation, votes, lives, and outcomes **in memory**. Restarting the server clears live matches; local career stats remain. Hidden information is never stored in shared browser storage or sent in another player’s state. All factions are revealed on the final screen. Live matches do not survive a server restart. Hosting it online would also require HTTPS and deployment-level resource limits; it still does not require a database.

## Implementation

- `content.js`: all built-in tasks, answers, roles, actions, prompts, projects, events, and durations. This file is server-only so task answers are not shipped to the browser.
- `game.js`: faction rules, state machine, rewards, simulated-colleague logic, and per-player state filtering.
- `server.js`: built-in Node HTTP server, authenticated action requests, and personalized Server-Sent Events streams.
- `public/`: plain JavaScript, CSS, and an inline SVG office illustration. No external assets or font requests.
- `public/progress.js`: local career migration, XP, match history, and achievement definitions.
- `test/game.test.js` and `test/expansion.test.js`: state-machine and career tests using Node’s built-in runner.

Server-Sent Events synchronize server-to-browser state; authenticated HTTP requests carry actions back. This provides the same authoritative multiplayer model without a WebSocket dependency. Guest tokens identify a player and should be treated as private session credentials.

## Verify

```sh
npm test
```

Tests cover faction counts and privacy, readiness and host checks, all task definitions, task validation, sabotage limits, voting and promotions, appeals and eliminations, ending precedence, reconnects, timers, influence, abandonment, rematches, practice behavior, public recommendations, daily modifiers, milestone rewards, objectives, and career migration/deduplication.
