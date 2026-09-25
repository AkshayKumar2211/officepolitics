const SNAPSHOT_ID = 'office-politics';

export async function restoreGame(game, database) {
 const row = await database.officePoliticsSnapshot.findUnique({where:{id:SNAPSHOT_ID}});
 if (!row) return;
 const snapshot = row.payload;
 if (snapshot?.version !== 1 || !Array.isArray(snapshot.rooms) || !Array.isArray(snapshot.tokens) || !Number.isFinite(snapshot.savedAt)) throw new Error('Unsupported database save.');
 const tokens = new Set(snapshot.tokens);
 for (const room of snapshot.rooms) {
  room.pausedAt ??= snapshot.savedAt;
  game.rooms.set(room.code, room);
  for (const player of room.players) {
   player.connected = !!player.bot;
   if (!player.bot) player.disconnectedAt = game.now();
   if (tokens.has(player.token)) game.sessions.set(player.token, {r:room,p:player});
  }
 }
}

// Serialize writes and copy state before awaiting I/O. A failed save stays dirty
// and retries next time; an older request cannot overwrite a newer checkpoint.
export function createPersistence(game, database) {
 let queue = Promise.resolve(), lastContent, lastClock;
 function save() {
  const operation = queue.then(async () => {
   const content = JSON.stringify({rooms:[...game.rooms.values()],tokens:[...game.sessions.keys()]});
   // Active timers must checkpoint their elapsed time even without actions.
   const clock = [...game.rooms.values()].some(r => r.deadline && r.pausedAt == null) ? Math.floor(game.now()/1000) : null;
   if (content === lastContent && clock === lastClock) return;
   const payload = {version:1,savedAt:game.now(),...JSON.parse(content)};
   await database.officePoliticsSnapshot.upsert({
    where:{id:SNAPSHOT_ID}, create:{id:SNAPSHOT_ID,payload}, update:{payload},
   });
   lastContent = content; lastClock = clock;
  });
  queue = operation.catch(() => {});
  return operation;
 }
 return {save};
}
