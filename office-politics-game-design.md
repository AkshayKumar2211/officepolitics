# Office Politics — Game Design & Implementation Brief

## 1. Purpose
Build a playable, browser-based multiplayer social deduction game called **Office Politics**. Players join a fictional company, receive workplace roles and private objectives, complete office-themed tasks, and secretly sabotage or protect one another. Players gather clues, discuss suspicions, and vote to identify the person behind political actions. Correctly identifying a saboteur earns career progress; incorrect accusations can cost a life. The game ends when two players remain, with a closing message that office politics ultimately damages the people and company involved.

This brief defines a practical first playable version. Keep the rules data-driven so more roles, tasks, and actions can be added later.

## 2. Product Requirements
- Multiplayer rooms with a host and a configurable player count.
- Real-time synchronized game state; server is authoritative for timers, actions, eliminations, voting, and promotions.
- Private role/objective information must never be sent to other players.
- Support reconnecting during an active round.
- Provide a usable desktop and mobile layout.
- Use fictional workplace conflict. Do not include real-world harassment, protected-class targeting, or personal information.

## 3. Game Summary
- **Genre:** Social deduction, party game
- **Players:** 5–10 (target 6–8 for first version)
- **Session length:** 15–25 minutes
- **Rounds:** Repeated workday cycles until two active players remain
- **Teams:** Office Staff and Political Operatives
- **Win condition:** The Staff wins by identifying all Political Operatives. Operatives win by surviving until only two players remain. The match then displays the requested anti-politics message, regardless of which side appears to have gained an advantage.

## 4. Theme and Tone
The satire is about destructive workplace behavior, not about endorsing it. Give the game a playful office aesthetic: inboxes, meeting rooms, project boards, coffee breaks, performance reviews, and HR forms. Sabotage should be fictional and non-graphic, such as delaying a report, removing a slide, spreading a misleading rumor, or taking credit for a task.

## 5. Player Roles and Designations
Each player receives a visible **job designation** and a private **faction/role**. Job title does not determine faction.

### Visible designations
Assign without duplication where possible; repeat titles if the room is larger than the list:
- Intern
- Software Engineer
- Designer
- HR Representative
- Team Manager
- Project Manager
- Office Coordinator (the “office boy” concept, presented respectfully)
- Finance Analyst
- Marketing Associate
- Operations Lead

Designation is primarily flavor and can provide a small once-per-game perk in a later iteration. In the MVP, titles are cosmetic so players can learn the core loop.

### Private factions
- **Office Staff:** Most players. Complete team tasks, observe clues, discuss, and vote to identify Political Operatives.
- **Political Operative:** Secret saboteur. Complete private sabotage objectives while appearing to contribute to work. Operatives know their own faction; they do not automatically know other operatives unless a future mode specifies otherwise.

### Faction count
Use a deterministic room-size table:
- 5–6 players: 1 operative
- 7–9 players: 2 operatives
- 10 players: 3 operatives
The host cannot change faction counts in the MVP.

## 6. Core Match Loop
Each round is one workday with the following phases:

1. **Morning briefing (20 seconds):** Show the company status, current shared task, and players still active. Each player sees their private objective.
2. **Work phase (90 seconds):** Players complete short tasks. Operatives can secretly perform sabotage actions. Some actions leave evidence or create a visible issue.
3. **Incident report (10 seconds):** The game summarizes discovered task failures and evidence without revealing the actor.
4. **Meeting and discussion (60 seconds):** Players use text chat or quick-chat prompts to discuss. No voice chat is required for the MVP.
5. **Accusation and vote (20 seconds):** Each active player privately selects one active player or abstains. Votes are revealed together when the timer ends.
6. **Resolution:** If a player is correctly identified as an operative, they are eliminated. If the vote is incorrect, the accused may lose a life (see Section 9). Apply promotions/rewards and check end conditions.
7. **Next workday:** Start another round if more than two players remain.

Only active players may perform actions, speak in the meeting, or vote. Eliminated players switch to spectator mode and cannot reveal private information through game UI.

## 7. Tasks
Tasks are quick, understandable office activities, designed to take 5–20 seconds. Each has a title, instructions, input validation, and a server-side result.

### MVP task examples
- **Sort the Inbox:** Drag messages into the correct priority order.
- **Review the Pull Request:** Select the valid issue from three code-review notes (no actual programming knowledge required).
- **Prepare the Meeting Room:** Match agenda items to time slots.
- **Reconcile Expenses:** Select which fictional receipts do not match the policy.
- **Fix the Slide Deck:** Put a short set of slides in the correct order.
- **Route the Support Tickets:** Assign tickets to the correct department.

### Task outcomes
- A task can be completed, missed, or sabotaged.
- Shared tasks contribute to a visible company progress bar.
- Some sabotage actions reduce progress or introduce an issue that players can discover.
- Do not make a single failed task immediately identify a player; clues should support deduction but leave room for discussion.

## 8. Operative Actions (Sabotage)
During the work phase, an operative may use at most one sabotage action per round. Actions have cooldowns or limited charges, and should be logged server-side.

MVP actions:
- **Delay the Report:** Reduce shared task progress slightly; may leave a timestamp clue.
- **Move the File:** Temporarily hide a fictional project document; a player can restore it.
- **Plant a Misleading Note:** Add one ambiguous clue to the incident report.
- **Take Credit:** Claim a completed contribution; if discovered, expose a clue.
- **Gossip:** Privately send a rumor prompt about a selected player, using preset game text. The recipient is not told who initiated it.

Actions must not allow unrestricted player-written accusations to be broadcast as facts. Use chat moderation controls and report/mute functionality if free text is included.

## 9. Accusations, Lives, and Elimination
The user’s “apply for lives / lie to get lives” idea is implemented as a comedic **HR Appeal** mechanic.

- Each player starts with **2 lives**.
- When a player is accused and the vote is wrong, the accused may submit an HR Appeal once per match. They choose one of three fictional explanations (e.g., “I was fixing the shared file,” “I was in a meeting,” “That clue was planted”). This is roleplay and not a truth-detection minigame.
- The room then votes **Accept Appeal** or **Reject Appeal**. If accepted, no life is lost. If rejected, the accused loses one life.
- If there is a tie or everyone abstains, nobody is eliminated and no one loses a life.
- A correct majority vote against an operative eliminates that operative immediately, regardless of remaining lives.
- When a player reaches zero lives after an incorrect accusation, they are eliminated from active play.
- Each player may initiate only one accusation ballot per round; the ballot is global and simultaneous.

This separates evidence-based identification from the playful appeal. Do not secretly change an appeal’s outcome based on faction in the MVP; the appeal is decided by players.

## 10. Promotion and Progression
Career rank is separate from faction and lives. A correct identification promotes the voter who cast a correct vote, if any; if multiple voters correctly selected the eliminated operative, all receive one rank step. Promotions are capped at the final title.

Suggested ladder:
1. Intern
2. Associate
3. Senior Associate
4. Team Lead
5. Department Manager
6. Executive

Promotion reward: display the new title and award one **Influence token** (maximum 2). A player may spend an Influence token once per match to request one additional clue during the incident report. Do not allow tokens to reveal a player’s private role directly.

The first version may keep job designation cosmetic and use this ladder only as match progression. Keep these concepts distinct in the data model.

## 11. Clues and Information Rules
- Clues should be generated by server-validated events, not client claims.
- A clue can mention timing, an affected task, an action category, or a broad location (e.g. “someone accessed the project board after the stand-up”).
- Avoid guaranteed role reveals before the meeting vote.
- A player’s private faction, objective, unused actions, and action history are private.
- Operatives may receive private objectives that encourage varied play, but objectives must not require targeting a specific real person or using offensive language.

## 12. End Conditions and Ending Message
End the match immediately when **two active players remain**. This rule is intentional and must not be delayed by an unfinished task or appeal.

Show a short end screen with the final ranks and the message:

> **The company that plays office politics never truly wins. It only breaks trust, harms people’s futures, and eventually destroys itself.**

Then show a “Play Again” button and return players to the lobby. Do not declare an individual winner in the final two-player ending; the moral is that destructive office politics leaves everyone worse off.

If all operatives are eliminated before two players remain, end the match with a Staff victory screen and a shorter closing line: “Trust helped this team succeed.”

## 13. Lobby and Matchmaking
- Create a private room with a short join code.
- Join by code; show connected players and ready state.
- Host can start when at least five players are connected and ready.
- If a player disconnects during a round, keep their seat for 30 seconds. If they do not reconnect, mark them inactive; do not count them as an active voter. If fewer than three active players remain, end the match as abandoned.
- Include “Leave room” and “Report / mute” controls.

## 14. Screens and UI
1. **Landing screen:** Game title, Create Room, Join Room, How to Play.
2. **Lobby:** Room code, roster, visible designation, ready toggle, host start control.
3. **Private briefing:** Designation, faction instructions, private objective, rules reminder.
4. **Work screen:** Shared task, personal task, company progress, timer, action controls available to the player.
5. **Incident report:** Issues and clues, no actor attribution.
6. **Meeting screen:** Active roster, discussion chat/quick chat, countdown, accuse/vote control.
7. **Appeal screen:** Explanation choices and accept/reject vote.
8. **Results screen:** Eliminated player’s faction reveal, rank changes, lives, and next-day button/countdown.
9. **Final screen:** End message and rematch/lobby controls.
10. **Spectator screen:** Public game information only; private roles and objectives stay hidden until the match ends.

Use clear status labels, accessible contrast, keyboard-friendly task controls, and responsive layouts.

## 15. Technical Requirements for the Coding Agent
If no stack is already specified by the project, use a straightforward web stack such as React/Next.js with TypeScript, a Node.js WebSocket server (Socket.IO is acceptable), and PostgreSQL for persistent accounts/statistics. The core game should work without accounts using guest names and in-memory or short-lived room state; persistence can be added after the MVP.

### Server-authoritative logic
The server must own:
- Room membership and readiness
- Random faction/designation assignment
- Phase transitions and timers
- Task validation and progress
- Sabotage/action availability and cooldowns
- Evidence generation
- Votes and appeal outcomes
- Lives, eliminations, promotions, and end conditions

Never trust client-supplied role, vote tally, timer, task score, or elimination state.

### Suggested core entities
- `Room`: id, joinCode, hostPlayerId, status, settings, createdAt
- `Player`: id, roomId, displayName, connectionStatus, isReady, isAlive, lives, rank, designation
- `SecretPlayerState`: playerId, faction, privateObjective, usedActions, appealUsed
- `Match`: id, roomId, phase, roundNumber, phaseEndsAt, companyProgress, status
- `TaskInstance`: id, matchId, taskType, assignedPlayerId or shared, state, startedAt, completedAt
- `ActionEvent`: id, matchId, actorPlayerId (private), actionType, targetPlayerId (optional), roundNumber, createdAt
- `Clue`: id, matchId, publicText, relatedRound, sourceEventId (server-only link)
- `Vote`: matchId, roundNumber, voterPlayerId, targetPlayerId or abstain
- `Appeal`: matchId, roundNumber, playerId, explanationType, decision tally

Secret fields must be filtered out of every public room/game payload.

### Suggested WebSocket events
Client to server: `room:create`, `room:join`, `player:ready`, `match:start`, `task:submit`, `action:use`, `vote:cast`, `appeal:submit`, `appeal:vote`, `chat:send`, `room:leave`.
Server to client: `room:state`, `match:phase`, `task:updated`, `incident:published`, `vote:result`, `player:eliminated`, `player:promoted`, `match:ended`, `error`.
Validate every payload with a schema and ensure a client can only act as its authenticated room player.

## 16. MVP Acceptance Criteria
The game is ready for an MVP demo when:
- 5–10 players can join a room, ready up, and start a match.
- The server assigns the correct number of hidden operatives and visible designations.
- Each player receives private information visible only to them.
- Work phases accept valid task submissions and update shared progress.
- Operatives can perform one legal sabotage action per round; invalid/repeated actions are rejected.
- Incident reports reveal clues without exposing the actor.
- Players can discuss and cast simultaneous votes; ties/abstentions resolve as specified.
- Incorrect accusations support an HR Appeal and life loss; zero lives eliminates a player.
- Correct votes eliminate operatives and award rank progress.
- Match ends exactly when two active players remain, with the specified message, or when all operatives are eliminated.
- Reconnecting restores the player to the current phase without duplicating actions or votes.
- A player cannot inspect another player’s faction or private objective through UI events or API responses.
- The layout works on mobile and desktop, and timers remain consistent across clients.

## 17. Out of Scope for the First Version
- Voice chat
- Public matchmaking/ranking
- Purchases or monetization
- Custom user-created roles or sabotage text
- Persistent player accounts and long-term progression
- AI-controlled players
- More than one game mode

## 18. Implementation Guidance
Build in this order:
1. Define shared types, state machine, and server-side room rules.
2. Implement lobby and connection/reconnect handling.
3. Implement phase timer and private role delivery.
4. Add one shared task and two personal tasks.
5. Add one sabotage action and evidence generation.
6. Add meeting, voting, appeals, lives, and elimination.
7. Add promotion, end conditions, and final screens.
8. Test multiple simultaneous clients, reconnects, ties, duplicate actions, stale timers, and private-data leakage.

Keep task content, role counts, phase durations, and action definitions configurable. Favor deterministic server tests for game rules before visual polish.
