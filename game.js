import { ensureWorkplace, startOfficeDay, workplaceView, workplaceAction, closeOfficeDay } from './workplace.js';
import { randomUUID, randomInt } from 'node:crypto';
import { DESIGNATIONS, RANKS, DURATIONS, ACTIONS, PROMPTS, EXPLANATIONS, TASKS, PROJECTS, OFFICE_EVENTS, PRACTICE_DURATIONS } from './content.js';
export { DESIGNATIONS, RANKS, DURATIONS, ACTIONS, PROMPTS, EXPLANATIONS, TASKS } from './content.js';
const shuffle = xs => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = randomInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fail = message => { throw new Error(message); };
export class Game {
 constructor(now = () => Date.now()) { this.rooms = new Map(); this.sessions = new Map(); this.now = now; }
 create(name, capacity = 8) {
  if (!Number.isInteger(capacity) || capacity < 5 || capacity > 10) fail('Choose between 5 and 10 seats.');
  let code; do { code = Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[randomInt(32)]).join(''); } while (this.rooms.has(code));
  const room = { code, capacity, players: [], phase: 'lobby', round: 0, progress: 0, clues: [], events: [], chat: [], votes: {}, appealVotes: {}, deadline: null, result: null, createdAt: this.now() };
  this.rooms.set(code, room); return this.join(code, name);
 }
 join(code, name) {
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 24) fail('Enter a name between 1 and 24 characters.');
  const r = this.rooms.get(String(code).toUpperCase()); if (!r) fail('That room was not found. Check your code.');
  if (r.practice) fail('Practice offices are private. Create a multiplayer room to invite friends.');
  if (r.phase !== 'lobby') fail('This match has already started.');
  if (r.players.length >= r.capacity) fail('This room is full.');
  const p = { id: randomUUID(), token: randomUUID(), name: name.trim(), designation: DESIGNATIONS[r.players.length], connected: false, disconnectedAt: this.now(), x: 1 + r.players.length % 10, y: 4, coffee: 0, ready: false, alive: true, lives: 2, rank: 0, influence: 0, influenceUsed: false, appealUsed: false, faction: null, tasks: [], completed: 0, correctVotes: 0, sabotages: 0, objectives: 0 };
  r.players.push(p); r.hostId ??= p.id; this.sessions.set(p.token, { r, p }); return { token: p.token, code: r.code };
 }
 practice(name, faction = 'staff') {
  if (!['staff', 'operative', 'random'].includes(faction)) fail('Choose a valid practice role.');
  const session = this.create(name, 6);
  const { r, p } = this.session(session.token);
  for (const name of ['Morgan', 'Jamie', 'Sam', 'Taylor', 'Robin']) {
   const bot = this.join(r.code, name + ' · Sim');
   const colleague = this.session(bot.token).p;
   colleague.bot = true; this.connect(bot.token); colleague.ready = true;
  }
  r.practice = true; r.practiceRole = faction;
  this.connect(p.token); p.ready = true; this.action(p.token, 'start');
  return session;
 }
 session(token) { const s = this.sessions.get(token); if (!s) fail('Your session expired. Please join a room.'); return s; }
 connect(token) { const { r, p } = this.session(token); if (r.pausedAt != null) { const shift = this.now() - r.pausedAt; for (const key of ['deadline','phaseStartedAt','workStartedAt']) if (r[key] != null) r[key] += shift; for (const x of r.players) { if (!x.bot) x.disconnectedAt = this.now(); for (const key of ['botNextTask','botSabotageAt']) if (x[key] != null) x[key] += shift; } delete r.pausedAt; } p.connected = true; p.disconnectedAt = null; return r; }
 disconnect(token) { const s = this.sessions.get(token); if (s) { s.p.connected = false; s.p.disconnectedAt = this.now(); } }
 active(r) { return r.players.filter(p => p.alive); }
 voters(r) { return this.active(r).filter(p => p.connected); }
 phase(r, phase) { const durations = r.practice ? PRACTICE_DURATIONS : DURATIONS; r.phase = phase; r.phaseStartedAt = this.now(); r.deadline = durations[phase] ? this.now() + durations[phase] * 1000 : null; if (phase === 'work') r.workStartedAt = this.now(); }
 day(r) {
  r.coffee = [{x:2,y:1},{x:9,y:1},{x:5,y:6}]; r.round++; r.votes = {}; r.appealVotes = {}; r.clues = []; r.events = []; r.fileMissing = false; r.result = null; r.accused = null; r.explanation = null;
  r.project = PROJECTS[(r.round - 1) % PROJECTS.length]; r.officeEvent = OFFICE_EVENTS[(r.round - 1) % OFFICE_EVENTS.length];
  r.botNominee = null; r.goal = { target: Math.max(3, this.active(r).length * 2), completed: 0, awarded: false }; r.nomination = null;
  for (const p of r.players) { p.recommended = false; p.objectiveDone = false; p.botChatRound = 0; p.botNextTask = this.now() + 15000 + randomInt(5000); p.botSabotageAt = this.now() + 22000 + randomInt(8000); p.actionUsed = false; p.rumor = null; p.tasks = [0,1,2].map((n) => ({ id: randomUUID(), type: ((r.round - 1) * 3 + r.players.indexOf(p) * 3 + n) % TASKS.length, done: false })); }
  startOfficeDay(this,r); this.phase(r, 'briefing');
 }
 finish(r, ending) { r.ending = ending; this.phase(r, 'ended'); }
 checkEnd(r) {
  if (this.active(r).length <= 2) { this.finish(r, 'politics'); return true; }
  if (!this.active(r).some(p => p.faction === 'operative')) { this.finish(r, 'staff'); return true; } return false;
 }
 evidence(r, actor, action) {
  const others = shuffle(this.active(r).filter(p => p.id !== actor.id)).slice(0, 2);
  const suspects = shuffle([actor, ...others]).map(p => p.name).join(', ');
  const text = action === 'Plant a Misleading Note' ? 'An unsigned note claims the delay started in the meeting room. Its contents cannot be verified.' : `A shared workstation was used near the incident. Its access group includes ${suspects}. This does not establish who used it.`;
  r.clues.push({ id: randomUUID(), text, suspects: action === 'Plant a Misleading Note' ? [] : [actor, ...others].map(p => p.id).sort() }); r.events.push({ actorId: actor.id, action, at: this.now() });
 }
 action(token, type, data = {}) {
  const { r, p } = this.session(token);
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail('Invalid action.');
  if (type === 'leave') {
   for(const job of r.jobs||[]) if(job.ownerId===p.id && job.status==='in_progress'){job.ownerId=null;job.status='open';}
   this.sessions.delete(token); p.connected = false; p.alive = false;
   if (r.practice && !p.bot) { for (const x of r.players) this.sessions.delete(x.token); this.rooms.delete(r.code); this.finish(r, 'abandoned'); return r; }
   if (r.phase === 'lobby') r.players = r.players.filter(x => x !== p);
   if (r.hostId === p.id) r.hostId = r.players.find(x => x.connected)?.id ?? r.players.find(x => x.id !== p.id)?.id;
   if (!['lobby', 'ended'].includes(r.phase)) { if (this.active(r).length < 3) this.finish(r, 'abandoned'); else this.checkEnd(r); }
   return r;
  }
  if (!p.connected) fail('Reconnect before taking an action.');
  if (['move', 'say', 'emote'].includes(type)) {
   if (!p.alive && r.phase !== 'ended') fail('Spectators can watch but cannot interact.');
   if (type === 'move') {
    if (!['lobby','briefing','work','ended'].includes(r.phase)) fail('Stay seated during the meeting.');
    if (!Number.isInteger(data.dx) || !Number.isInteger(data.dy) || Math.abs(data.dx) + Math.abs(data.dy) !== 1) fail('Move one square at a time.');
    if (p.lastMove != null && this.now() - p.lastMove < 140) fail('Slow down a little.');
    const x = p.x + data.dx, y = p.y + data.dy;
    if (x < 0 || x > 11 || y < 0 || y > 7 || ([2,3,8,9].includes(x) && [2,5].includes(y))) fail('A desk blocks that path.');
    p.x = x; p.y = y; p.lastMove = this.now();
    const cup = r.coffee?.findIndex(c => c.x === x && c.y === y) ?? -1;
    if (r.phase === 'work' && cup >= 0) { r.coffee.splice(cup,1); p.coffee = (p.coffee || 0) + 1; r.progress = Math.min(100,r.progress + 2); }
   } else {
    if (p.lastSocial != null && this.now() - p.lastSocial < 1500) fail('Give your colleagues a moment to respond.');
    if (type === 'emote') {
     if (!['👋','😂','☕','🎉','🤔','❤️'].includes(data.text)) fail('Choose a reaction.');
     p.emote = data.text; p.emoteUntil = this.now() + 4000;
    } else {
     if (typeof data.text !== 'string' || !data.text.trim() || data.text.trim().length > 240 || /[\x00-\x1f\x7f]/.test(data.text)) fail('Write a message of 1–240 characters on one line.');
     r.chat.push({id:randomUUID(),playerId:p.id,name:p.name,text:data.text.trim(),round:r.round}); r.chat = r.chat.slice(-80);
    }
    p.lastSocial = this.now();
   }
   return r;
  }
  if (workplaceAction(this,r,p,type,data)) return r;
  if (type === 'fillSeats') {
   if(r.phase!=='lobby'||r.hostId!==p.id||r.practice) fail('Only the multiplayer host can add simulated colleagues in the lobby.');
   const needed=Math.min(r.capacity,5)-r.players.length; if(needed<=0) fail('Your office already has enough colleagues to start.');
   for(let i=0;i<needed;i++){const session=this.join(r.code,'Colleague '+(r.players.length+1)+' · Sim');const bot=this.session(session.token).p;bot.bot=true;this.connect(bot.token);bot.ready=true;}return r;
  }
  if (type === 'ready') { if (r.phase !== 'lobby') fail('The match has already started.'); p.ready = !p.ready; return r; }
  if (type === 'start') {
   if (r.hostId !== p.id || r.phase !== 'lobby') fail('Only the host can start from the lobby.');
   if (r.players.length < 5 || !r.players.every(x => x.connected && x.ready)) fail('At least five players must be connected, and everyone must be ready.');
   const count = r.players.length <= 6 ? 1 : r.players.length <= 9 ? 2 : 3;
   let ops = shuffle(r.players).slice(0, count);
   if (r.practice && r.practiceRole !== 'random') ops = r.practiceRole === 'operative' ? [r.players.find(x => !x.bot)] : shuffle(r.players.filter(x => x.bot)).slice(0, count);
   for (const x of r.players) x.faction = ops.includes(x) ? 'operative' : 'staff';
   r.matchId = randomUUID(); this.day(r); return r;
  }
  if (type === 'rematch') {
   if (r.hostId !== p.id || r.phase !== 'ended') fail('Only the host can reopen the lobby after a match.');
   for (const x of r.players.filter(x => !x.connected)) this.sessions.delete(x.token);
   r.players = r.players.filter(x => x.connected); r.progress = 0; r.round = 0; r.ending = null; r.clues = []; r.chat = []; r.result = null; r.jobs=[];r.activity=[];r.morale=70;
   for (const x of r.players) Object.assign(x, { faction: null, ready: !!x.bot, alive: true, lives: 2, rank: 0, influence: 0, influenceUsed: false, appealUsed: false, completed: 0, correctVotes: 0, sabotages: 0, objectives: 0, tasks: [], reputation:0, energy:3, coffee:0 });
   this.phase(r, 'lobby'); return r;
  }
  if (type === 'nextPhase') { if (!r.practice || p.bot || r.hostId !== p.id || ['lobby', 'ended'].includes(r.phase)) fail('Only the practice host can advance time.'); if (r.deadline <= this.now()) r.deadline = this.now() + 1; this.runBots(r, true); this.advance(r); return r; }
  if (!p.alive || ['ended','lobby'].includes(r.phase)) fail('Only active players can act during a match.');
  if (r.deadline && this.now() >= r.deadline) fail('This phase has ended. Please wait for the next phase.');
  if (type === 'task') {
   if (r.phase !== 'work') fail('Tasks are available during work time.');
   const task = p.tasks.find(x => x.id === data.id); if (!task || task.done) fail('This task is not available.');
   if (JSON.stringify(data.answer) !== JSON.stringify(TASKS[task.type].answer)) fail('Not quite. Check the instructions and try again.');
   task.done = true; p.completed++; r.progress = Math.min(100, r.progress + r.officeEvent.taskPoints + (p.tasks.every(t => t.done) ? r.officeEvent.deskBonus : 0));
   r.goal.completed++; if (!r.goal.awarded && r.goal.completed >= r.goal.target) { r.goal.awarded = true; r.progress = Math.min(100, r.progress + 8); for (const x of this.active(r)) x.influence = Math.min(2, x.influence + 1); }
  } else if (type === 'restore') {
   if (r.phase !== 'work' || !r.fileMissing) fail('There is no missing file to restore.'); r.fileMissing = false; r.progress = Math.min(100, r.progress + r.officeEvent.restorePoints);
  } else if (type === 'sabotage') {
   if (r.phase !== 'work' || p.faction !== 'operative' || p.actionUsed || !ACTIONS.includes(data.action)) fail('This action is not available.');
   if (data.action === 'Take Credit' && !r.players.some(x => x.tasks.some(t => t.done))) fail('Wait for a completed contribution first.');
   const target = r.players.find(x => x.id === data.target && x.alive && x.id !== p.id);
   if (data.action === 'Gossip' && !target) fail('Choose an active colleague.');
   p.actionUsed = true; p.sabotages++;
   if (data.action === 'Delay the Report') r.progress = Math.max(0, r.progress - 8);
   if (data.action === 'Move the File') { r.fileMissing = true; r.progress = Math.max(0, r.progress - 4); }
   const disruption = { 'Flood the Inbox': 6, 'Book a Ghost Meeting': 5, 'Scramble the Forecast': 7, 'Jam the Printer': 4, 'Scope Creep': 5 }[data.action];
   if (disruption) r.progress = Math.max(0, r.progress - disruption);
   if (data.action === 'Gossip') target.rumor = 'Someone suggests the project board was changed during stand-up. This is an unverified rumor.';
   this.evidence(r, p, data.action);
  } else if (type === 'chat') {
   if (r.phase !== 'meeting' || !PROMPTS.includes(data.text)) fail('Choose a meeting quick-chat prompt.');
   if (p.lastChat && this.now() - p.lastChat < 2000) fail('Give your colleagues a moment to respond.');
   p.lastChat = this.now(); r.chat.push({ id: randomUUID(), playerId: p.id, name: p.name, text: data.text, round: r.round }); r.chat = r.chat.slice(-80);
  } else if (type === 'recommend') {
   const target = this.voters(r).find(x => x.id === data.target && x.id !== p.id);
   if (r.phase !== 'meeting' || !target || p.recommended) fail('Make one public recommendation during the meeting.');
   p.recommended = true; r.nomination = target.id; r.chat.push({ id: randomUUID(), playerId: p.id, name: p.name, text: `I suggest reviewing ${target.name} before we vote. This is a suspicion, not proof.`, round: r.round });
  } else if (type === 'vote') {
   if (r.phase !== 'vote' || Object.hasOwn(r.votes, p.id)) fail('You can submit one ballot per workday.');
   if (data.target !== null && !this.voters(r).some(x => x.id === data.target && x.id !== p.id)) fail('Choose an active colleague or abstain.');
   r.votes[p.id] = data.target;
  } else if (type === 'appeal') {
   if (r.phase !== 'appeal' || r.accused !== p.id || r.explanation !== null || !EXPLANATIONS.includes(data.text)) fail('This appeal is not available.');
   r.explanation = data.text; p.appealUsed = true;
  } else if (type === 'appealVote') {
   if (r.phase !== 'appeal' || r.explanation === null || p.id === r.accused || Object.hasOwn(r.appealVotes, p.id) || typeof data.accept !== 'boolean') fail('This appeal ballot is not available.');
   r.appealVotes[p.id] = data.accept;
  } else if (type === 'influence') {
   if (r.phase !== 'incident' || p.influence < 1 || p.influenceUsed) fail('An influence token is needed, once per match.');
   p.influence--; p.influenceUsed = true;
   r.clues.push({ id: randomUUID(), text: r.events.length ? `Records confirm ${r.events.length} suspicious action(s) during this workday. The first was logged ${Math.max(0, Math.floor((r.events[0].at - r.workStartedAt) / 1000))} seconds after work began.` : 'The audit found no sabotage actions recorded this workday. A missed task alone is not evidence.' });
  } else fail('Unknown action.');
  const done = p.tasks.filter(t => t.done).length;
  if (!p.objectiveDone && (p.faction === 'staff' ? done === 3 : done >= 1 && p.actionUsed)) { p.objectiveDone = true; p.objectives++; p.influence = Math.min(2, p.influence + 1); }
  return r;
 }
 resolveVote(r) {
  const eligible = this.voters(r); const tally = {};
  for (const x of eligible) { const target = r.votes[x.id]; if (target && eligible.some(y => y.id === target)) tally[target] = (tally[target] || 0) + 1; }
  const top = Object.entries(tally).sort((a,b) => b[1]-a[1])[0];
  r.result = { ballots: eligible.map(x => ({ voter: x.name, target: r.players.find(y => y.id === r.votes[x.id])?.name || 'Abstain' })), title: 'No majority. No penalty.', text: 'The team could not agree on an accusation. Everyone keeps their lives.', promoted: [] };
  if (!top || top[1] <= eligible.length / 2) { this.phase(r, 'resolution'); return; }
  const accused = r.players.find(x => x.id === top[0]); r.accused = accused.id;
  if (accused.faction === 'operative') {
   accused.alive = false; accused.lives = 0;
   r.result.title = `${accused.name} was a Political Operative.`; r.result.text = 'The operative has been removed from active play. Correct voters earn a promotion and an influence token.';
   for (const x of eligible.filter(x => r.votes[x.id] === accused.id)) { x.rank = Math.min(5, x.rank + 1); x.influence = Math.min(2, x.influence + 1); x.correctVotes++; r.result.promoted.push(x.name); }
   if (!this.checkEnd(r)) this.phase(r, 'resolution');
  } else if (!accused.appealUsed) this.phase(r, 'appeal');
  else this.penalty(r, accused, false);
 }
 penalty(r, p, saved) {
  if (!saved) p.lives--; if (p.lives <= 0) p.alive = false;
  r.result.title = saved ? `${p.name}’s appeal was accepted or tied.` : `${p.name} lost a life.`;
  r.result.text = saved ? 'The team grants the benefit of the doubt. No life is lost.' : `The accusation was incorrect. ${p.name} was Office Staff. ${p.alive ? 'They remain at work.' : 'They are now a spectator.'}`;
  if (!this.checkEnd(r)) this.phase(r, 'resolution');
 }
 advance(r) {
  switch (r.phase) {
   case 'briefing': this.phase(r, 'work'); break;
   case 'work': closeOfficeDay(this,r); if (!r.clues.length) r.clues.push({ id: randomUUID(), text: 'No unusual access was recorded. Incomplete work alone does not identify an operative.' }); this.phase(r, 'incident'); break;
   case 'incident': this.phase(r, 'meeting'); break;
   case 'meeting': this.phase(r, 'vote'); break;
   case 'vote': this.resolveVote(r); break;
   case 'appeal': {
    const p = r.players.find(x => x.id === r.accused); const votes = this.voters(r).filter(x => x.id !== p.id).map(x => r.appealVotes[x.id]);
    const yes = votes.filter(x => x === true).length, no = votes.filter(x => x === false).length;
    this.penalty(r, p, r.explanation !== null && yes >= no); break;
   }
   case 'resolution': this.day(r); break;
  }
 }
 runBots(r, force = false) {
  if (!r.players.some(p=>p.bot) || ['lobby', 'ended'].includes(r.phase)) return false;
  let changed = false;
  const elapsed = this.now() - r.phaseStartedAt;
  const execute = (p, type, data) => { this.action(p.token, type, data); changed = true; };
  for (const p of this.voters(r).filter(x => x.bot)) {
   if (['briefing','work'].includes(r.phase) && (!p.botWalkAt || this.now() >= p.botWalkAt)) {
    const [dx,dy] = [[0,1],[0,-1],[1,0],[-1,0]][randomInt(4)];
    try { execute(p,'move',{dx,dy}); } catch {}
    p.botWalkAt = this.now() + 1800 + randomInt(1200);
   }
   if (r.phase === 'work') {
    const review=(r.jobs||[]).find(j=>j.status==='review'&&j.ownerId!==p.id);
    if(review && (force || elapsed>12000))execute(p,'reviewJob',{id:review.id,answer:TASKS[review.type].answer});
    if (force || this.now() >= p.botNextTask) {
     const tasks = p.tasks.filter(t => !t.done).slice(0, force ? 3 : 1);
     for (const task of tasks) execute(p, 'task', { id: task.id, answer: TASKS[task.type].answer });
     p.botNextTask = this.now() + 12000 + randomInt(5000);
    }
    if (p.faction === 'operative' && !p.actionUsed && (force || this.now() >= p.botSabotageAt)) execute(p, 'sabotage', { action: ['Delay the Report', 'Move the File', 'Flood the Inbox'][randomInt(3)] });
   }
   if (r.phase === 'meeting' && (!p.lastChat || this.now() - p.lastChat >= 2000) && p.botChatRound !== r.round && (force || elapsed > 3000 + r.players.indexOf(p) * 1500)) {
    execute(p, 'chat', { text: PROMPTS[(r.players.indexOf(p) + r.round) % PROMPTS.length] }); p.botChatRound = r.round;
   }
   if (r.phase === 'vote' && !Object.hasOwn(r.votes, p.id) && (force || elapsed > 5000)) {
    // Colleagues use public evidence and public recommendations, never hidden factions or ballots.
    if (!r.botNominee) {
     const candidates = this.voters(r);
     const scores = candidates.map(x => ({ id: x.id, score: r.clues.filter(c => c.suspects?.includes(x.id)).length }));
     const best = Math.max(...scores.map(x => x.score));
     const pool = scores.filter(x => x.score === best);
     r.botNominee = candidates.some(x => x.id === r.nomination) ? r.nomination : pool[randomInt(pool.length)]?.id;
    }
    execute(p, 'vote', { target: r.botNominee === p.id || !this.voters(r).some(x => x.id === r.botNominee) ? null : r.botNominee });
   }
   if (r.phase === 'appeal' && r.accused === p.id && r.explanation === null && (force || elapsed > 2000)) execute(p, 'appeal', { text: EXPLANATIONS[r.round % EXPLANATIONS.length] });
  }
  if (r.phase === 'appeal' && r.explanation !== null && (force || elapsed > 6000)) {
   for (const p of this.voters(r).filter(x => x.bot && x.id !== r.accused && !Object.hasOwn(r.appealVotes, x.id))) execute(p, 'appealVote', { accept: randomInt(3) !== 0 });
  }
  return changed;
 }
 tick() {
  const changed = [];
  for (const r of this.rooms.values()) {
   if (r.pausedAt != null) continue;
   let dirty = false;
   for (const p of [...r.players]) {
    if (!p.connected && p.disconnectedAt !== null && this.now() - p.disconnectedAt >= 30000) {
     if (r.phase === 'lobby') { r.players = r.players.filter(x => x !== p); this.sessions.delete(p.token); dirty = true; }
     else if (p.alive && r.phase !== 'ended') { p.alive = false; for(const job of r.jobs||[])if(job.ownerId===p.id&&job.status==='in_progress'){job.ownerId=null;job.status='open';} dirty = true; }
     if (r.hostId === p.id) { r.hostId = r.players.find(x => x.connected)?.id; dirty = true; }
    }
   }
   if (dirty && !['lobby', 'ended'].includes(r.phase)) { if (this.active(r).length < 3 || (r.practice && !r.players.some(p => !p.bot && p.alive))) this.finish(r, 'abandoned'); else this.checkEnd(r); }
   if (!r.players.some(p => p.connected && !p.bot) && this.now() - Math.max(r.createdAt, ...r.players.filter(p => !p.bot).map(p => p.disconnectedAt || 0)) > 3600000) { for (const p of r.players) this.sessions.delete(p.token); this.rooms.delete(r.code); continue; }
   if (r.deadline && this.now() < r.deadline && this.runBots(r)) dirty = true;
   if (r.deadline && this.now() >= r.deadline) { if (r.players.some(p=>p.bot)) { const overdue = this.now(); r.deadline = overdue + 1; this.runBots(r, true); } this.advance(r); dirty = true; }
   if (dirty) changed.push(r);
  }
  return changed;
 }
 view(token) {
  const {r,p} = this.session(token); ensureWorkplace(r);
  return { workplace:workplaceView(r,p), coffee: r.coffee || [], practice: !!r.practice, project: r.project, officeEvent: r.officeEvent, goal: r.goal, workSeconds: (r.practice ? PRACTICE_DURATIONS : DURATIONS).work, catalog: { taskCount: TASKS.length, projectCount: PROJECTS.length, actions: ACTIONS, prompts: PROMPTS }, code: r.code, capacity: r.capacity, hostId: r.hostId, phase: r.phase, round: r.round, progress: r.progress, deadline: r.deadline, now: this.now(), matchId: r.matchId, ending: r.ending, fileMissing: !!r.fileMissing,
   players: r.players.map(x => ({ id:x.id, reputation:x.reputation, department:x.department, x:x.x, y:x.y, coffee:x.coffee || 0, emote:x.emoteUntil > this.now() ? x.emote : null, bot: !!x.bot, name:x.name, designation:x.designation, connected:x.connected, ready:x.ready, alive:x.alive, lives:x.lives, rank:RANKS[x.rank], ...(r.phase === 'ended' ? {faction:x.faction} : {}) })),
   me: { id:p.id, recommended: !!p.recommended, objectiveDone: !!p.objectiveDone, sabotages: p.sabotages, objectives: p.objectives, sideObjective: !p.alive ? null : p.faction === 'operative' ? 'Complete a task and use a sabotage action today.' : 'Complete all three personal tasks today.', faction:p.alive ? p.faction : null, objective:p.alive ? (p.faction === 'operative' ? 'Blend in. Disrupt one contribution each workday and survive the vote.' : 'Keep the project moving. Compare clues and identify the operatives.') : 'Observe quietly. You can rejoin the team next match.', tasks: p.alive ? p.tasks.map(t => {const { answer, ...content } = TASKS[t.type]; return {...content, id:t.id, done:t.done};}) : [], actionUsed:p.actionUsed, influence:p.influence, influenceUsed:p.influenceUsed, appealUsed:p.appealUsed, voted:Object.hasOwn(r.votes,p.id), appealVoted:Object.hasOwn(r.appealVotes,p.id), rumor:p.alive?p.rumor:null, completed:p.completed, correctVotes:p.correctVotes },
   clues: ['incident','meeting','vote','appeal','resolution','ended'].includes(r.phase) ? r.clues : [], chat:r.chat, accused:r.accused, explanation:r.explanation, result:['resolution','ended','appeal'].includes(r.phase)?r.result:null,
  };
 }
}
