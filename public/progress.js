// Browser-only career data: pure helpers also exercised by the Node test suite.
export function normalizeStats(value = {}) {
 const result = {};
 for (const key of ['matches', 'tasks', 'correct', 'wins', 'practice', 'multiplayer', 'sabotages', 'objectives', 'xp']) result[key] = Number.isFinite(value?.[key]) && value[key] >= 0 ? value[key] : 0;
 result.finished = Array.isArray(value?.finished) ? value.finished.filter(id => typeof id === 'string').slice(-100) : [];
 result.history = Array.isArray(value?.history) ? value.history.filter(x => x && typeof x.id === 'string' && typeof x.project === 'string').slice(0, 20) : [];
 return result;
}
export function recordMatch(previous, state, date = new Date().toISOString()) {
 const stats = normalizeStats(previous);
 if (state.phase !== 'ended' || !state.matchId || stats.finished.includes(state.matchId)) return stats;
 const me = state.players.find(p => p.id === state.me.id);
 const won = state.ending === 'staff' && me?.faction === 'staff';
 const xp = state.ending === 'abandoned' ? 0 : 15 + state.me.completed * 2 + state.me.correctVotes * 25 + (state.me.objectives || 0) * 10;
 stats.matches++; stats.tasks += state.me.completed; stats.correct += state.me.correctVotes;
 stats.wins += won ? 1 : 0; stats[state.practice ? 'practice' : 'multiplayer']++;
 stats.sabotages += state.me.sabotages || 0; stats.objectives += state.me.objectives || 0; stats.xp += xp;
 stats.finished = [...stats.finished, state.matchId].slice(-100);
 stats.history.unshift({ id: state.matchId, date, project: state.project?.title || 'The quarterly launch', mode: state.practice ? 'Practice' : 'Multiplayer', ending: state.ending, faction: me?.faction, rank: me?.rank || 'Intern', days: state.round, tasks: state.me.completed, correct: state.me.correctVotes, xp });
 stats.history = stats.history.slice(0, 20);
 return stats;
}
export const ACHIEVEMENTS = [
 { id: 'first-day', title: 'First day on the job', description: 'Finish your first match.', key: 'matches', target: 1 },
 { id: 'busy-desk', title: 'Inbox zero', description: 'Complete 10 tasks across matches.', key: 'tasks', target: 10 },
 { id: 'workhorse', title: 'Office all-rounder', description: 'Complete 50 tasks across matches.', key: 'tasks', target: 50 },
 { id: 'detective', title: 'Read between the lines', description: 'Cast a correct operative vote.', key: 'correct', target: 1 },
 { id: 'investigator', title: 'Internal investigator', description: 'Cast 5 correct operative votes.', key: 'correct', target: 5 },
 { id: 'teamwork', title: 'Trust builder', description: 'Finish 3 Staff victories as Staff.', key: 'wins', target: 3 },
 { id: 'agenda', title: 'Hidden agenda', description: 'Use 5 sabotage actions across matches.', key: 'sabotages', target: 5 },
 { id: 'objectives', title: 'Above and beyond', description: 'Complete 5 private daily objectives.', key: 'objectives', target: 5 },
 { id: 'practice', title: 'Ready for the real office', description: 'Finish 3 practice matches.', key: 'practice', target: 3 },
 { id: 'social', title: 'Team regular', description: 'Finish 5 multiplayer matches.', key: 'multiplayer', target: 5 }
];
