# Office Politics

A browser multiplayer workplace game: handle client work, compare evidence, build alliances, and survive the office politics. Friends can play on separate laptops and phones through the same Vercel URL.

## Run locally

Requires Node.js 24 and PostgreSQL. Set `DATABASE_URL` in `.env`, then:

```sh
npm install
npm run db:deploy
npm start
```

Open **http://localhost:3000**. `npm run dev` reloads the local server after edits. The local server and Vercel use the same stateless API and Prisma data model.

## Update your existing Vercel deployment

Push these changes to the GitHub repository connected to your Vercel project. `vercel.json` supplies the build command, static output directory, and Node function routing. Use the **Other** framework preset if the dashboard asks; remove any old dashboard build/output overrides that conflict with `vercel.json`.

In Vercel **Project Settings → Environment Variables**, set `DATABASE_URL` to the working PostgreSQL URL for **Production**. Local `.env` files are not uploaded to Vercel. Use the session connection on port **5432** for the current database: its transaction endpoint on 6543 stalled Prisma migrations. Never use a `PUBLIC_` prefix for database credentials. If you enable Preview deployments, preferably use a separate preview database.

The build runs `npm run db:generate && npm run db:deploy`. Migrations add the room/member/assignment/chat/activity tables and copy old saved rooms once, preserving guest tokens. Existing unrelated tables and the legacy snapshot remain intact. Deployment must complete before the new client uses the new API. Test `https://YOUR-SITE.vercel.app/api/health` after deployment; it should return `{"ok":true}`.

Create an office, click the room code in the top bar, and send that link to your friends. The join form fills in the room code automatically. Everyone enters a name and readies up. The host starts when all seats are ready. Rooms support 5–10 players; with fewer friends, the host can **Fill empty seats with bots** to reach five. Solo practice remains available with five bots and manual phase advancement.

The implementation uses short authenticated requests, not a process-local room registry or an open event stream. Vercel function instances can handle different players because PostgreSQL stores the authoritative state and serializes updates to each room. See [Vercel Node functions](https://vercel.com/docs/functions/runtimes/node-js) and [project configuration](https://vercel.com/docs/project-configuration/vercel-json).

## Game controls

The furnished office fills the play screen, with animated coworkers, a status HUD, and menus that open over the game.

- **Move:** WASD or arrow keys on a keyboard; hold the directional buttons on a phone.
- **Interact:** press E or tap the station prompt when nearby.
- **Open panels:** T for your desk, J for the workboard, P for the crew, I for evidence, R for your role, and C for chat. The bottom toolbar provides the same controls on touchscreens.
- **Close:** Escape closes the current dialog, panel, or chat.
- **Map:** tap the mini-map to switch between the whole office and a camera following your character on small screens.
- **Game menu:** the top menu button opens the rules, career, notebook, fullscreen, invite, and leave controls. Multiplayer continues while menus are open.

## Environment

| Variable | Value | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Your private PostgreSQL URL | Required in local `.env` and Vercel environment settings. |
| `PORT` | `3000` | Optional, local server only. |
| `HOST` | `0.0.0.0` | Optional, local server only; use `127.0.0.1` for local-only access. |

No extra realtime service, API key, or local save path is required. `npm run db:studio` opens Prisma Studio locally; `npm run db:generate` regenerates the client after schema changes.

## A real office, with questionable colleagues

- **36 validated task templates**: expense reconciliation, purchase approvals, client complaints, contract renewals, incident response, sprint handovers, accessibility reviews, honest status reports, and time-zone scheduling. Three personal tasks rotate each day.
- **Three shared client assignments per workday**: claim a ticket, walk to its department station, solve the brief, then get another colleague to review it independently. Sign-off grants +6% company progress, +4 author reputation, +2 reviewer reputation, and +3 morale. Ownership and review are enforced on the server; simultaneous claims have one winner.
- **Handoffs**: transfer an active ticket to a connected colleague who has no active ticket. Leaving or losing your seat releases unfinished work.
- **Five office stations**: Engineering, Finance, Creative Studio, Operations, and the Break Room. WASD, arrows, or mobile buttons move across a shared 12 × 8 office. Desks block movement.
- **Energy and breaks**: shared submissions use one of three daily energy points. Take one break near the kitchenette to recover up to two energy and improve team morale.
- **Reputation and office politics**: give one colleague kudos per workday. Choose one networking alliance or take the spotlight for someone else’s delivered work. Credit claims raise your reputation while lowering the author’s reputation and team morale; the signed author/reviewer record stays unchanged. Public reputation does not prove innocence.
- **A visible paper trail** records claims, handoffs, sign-offs, alliances, credit disputes, and breaks. Each missed client assignment reduces morale by four at the deadline. Morale is a shared workplace score; it does not eliminate anyone or reveal factions.
- **Ten secret operative actions**, including Jam the Printer and Scope Creep. Operatives get one sabotage per day; actions leave ambiguous clues.
- **Six projects and six daily office events**, personal objectives, a shared milestone, promotion ranks, and influence tokens.
- **Room-wide text chat**, six emoji reactions, mute controls, preset meeting prompts, and public recommendations. Messages are limited to 240 characters and a 1.5-second cooldown; eliminated players observe until the end.
- **Coffee pickups**: three per workday, each giving +2% shared project progress.
- **Social deduction rounds**: briefing, work, incident report, meeting, private ballots, HR appeal, and review. Wrong accusations cost innocent colleagues lives. Staff wins by identifying all operatives; the two-survivor ending has no individual winner.

Multiplayer work phases last three minutes. Practice work phases last one minute, with a **Next phase** button. Simulated colleagues complete personal tasks, wander, review submitted shared assignments, discuss, sabotage, and vote using public evidence. They are rule-based bots, not AI services. Bots are explicitly labeled.

## Multiplayer persistence and schema

| Prisma model | Stored data |
| --- | --- |
| `OfficeRoom` | Room code, phase, capacity, mode, revision, and private authoritative room state. |
| `OfficeMember` | Guest identity, room relation, indexed SHA-256 session hash, designation, department, presence, and reputation. |
| `OfficeAssignment` | Task title/category, station, status, workday, owner, and reviewer IDs. |
| `OfficeChatMessage` | Room relation, sender, text, and workday. |
| `OfficeActivity` | Room relation, actor, timestamp, workday, and public activity text. |
| `OfficePoliticsSnapshot` | Legacy saves retained for one-time migration and recovery. |

The browser sends its opaque session token in an Authorization header. Each request looks up its room, locks the room row in a PostgreSQL transaction, validates the action, and commits the state before responding. Membership, assignments, chat, and activity records are updated transactionally when gameplay changes. Clients receive only their permitted view: other players’ roles, credentials, task answers, and unrevealed ballots stay server-side.

Visible tabs poll roughly every 1.2 seconds after the previous response; background tabs poll every five seconds. Actions also return an updated view immediately. Revisions prevent older replies from replacing newer state. Presence and phase transitions are evaluated on requests, with no background process required. Closing a tab stops its heartbeat; after 30 seconds, it loses its active seat when the next request processes the timeout. An office with no requests is not continuously simulated. The next request reconciles its phase and disconnected players. Polling adds latency and database traffic, so this is designed for small office groups rather than high-frequency action combat.

Any function instance can restore a room without an in-memory cache. Completed rooms stay available for reconnect; explicit practice-room departure removes that room and its related records. The legacy migration pauses imported matches until the first reconnect. Database contents include private game state and must not be exposed directly to browser clients.

This is **guest-session persistence**, not account/password login. Different devices join as different players. Lifetime career totals, achievements, notebook contents, mute choices, and saved reconnect details still live in browser storage. SessionStorage keeps the current tab’s token, so separate tabs can be separate players. LocalStorage keys: `op-name`, `op-session`, `op-stats`, `op-notes`, and `op-muted`.

## Code map

- `content.js`: server-only task briefs, answers, roles, events, and timers.
- `game.js`, `workplace.js`: authoritative game rules and cooperative office mechanics.
- `repository.js`: transactional room hydration, row locking, and relational persistence.
- `api-handler.js`, `api/index.js`: shared HTTP API and Vercel function entry point.
- `server.js`: local HTTP/static-file server using the same API.
- `prisma/`, `database.js`: schema, migrations, and PostgreSQL adapter.
- `storage.js`, `scripts/migrate-rooms.js`: compatibility for legacy snapshot imports.
- `public/app.js`: browser interactions, game panels, chat, and local career tracking.
- `public/scene.js`: illustrated office, animated characters, pickups, and following camera.
- `public/game.css`: game HUD, title screen, overlays, and responsive touch layout.

## Verify

```sh
npm test
# Creates isolated test rooms in the configured database, then removes them:
RUN_DATABASE_TESTS=1 node --test test/serverless.test.js
```

Tests cover task answers and privacy, votes and faction rules, peer review, station proximity, ownership/handoffs, politics limits, breaks, bot-filled multiplayer rooms, concurrent claims from separate database clients, cold-start restoration, room isolation, session revocation, Vercel routing, and invalid requests.
