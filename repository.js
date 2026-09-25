import { createHash } from 'node:crypto';
import { Game } from './game.js';
import { TASKS } from './content.js';
import { ensureWorkplace } from './workplace.js';
export const sessionHash = token => createHash('sha256').update(token).digest('hex');
const clean = value => JSON.parse(JSON.stringify(value));
export function hydrateRoom(state, now=()=>Date.now()) {
 if(state?.version!==2 || !state.room || !Array.isArray(state.tokens))throw Error('Unsupported room state.');
 const game=new Game(now), room=structuredClone(state.room);game.rooms.set(room.code,room);ensureWorkplace(room);
 for(const p of room.players)if(state.tokens.includes(p.token))game.sessions.set(p.token,{r:room,p});
 return {game,room};
}
export async function writeRoom(tx,game,room,project=true) {
 if(!game.rooms.has(room.code)){await tx.officeRoom.deleteMany({where:{code:room.code}});return;}
 ensureWorkplace(room);
 const state=clean({version:2,room,tokens:room.players.filter(p=>game.sessions.has(p.token)).map(p=>p.token)});
 const data={phase:room.phase,capacity:room.capacity,practice:!!room.practice,state};
 await tx.officeRoom.upsert({where:{code:room.code},create:{code:room.code,...data},update:data});
 if(!project)return;
 // All changes, including normalized records, share the room's transaction lock.
 await tx.officeMember.deleteMany({where:{roomCode:room.code}});
 if(room.players.length)await tx.officeMember.createMany({data:room.players.map(p=>({id:p.id,roomCode:room.code,sessionHash:game.sessions.has(p.token)?sessionHash(p.token):null,name:p.name,designation:p.designation,department:p.department,bot:!!p.bot,reputation:p.reputation,connected:!!p.connected,lastSeen:p.lastSeen?new Date(p.lastSeen):null}))});
 await tx.officeAssignment.deleteMany({where:{roomCode:room.code}});
 if(room.jobs.length)await tx.officeAssignment.createMany({data:room.jobs.map(j=>({id:j.id,roomCode:room.code,title:TASKS[j.type].title,category:TASKS[j.type].category,station:j.station,status:j.status,round:j.round,ownerId:j.ownerId,reviewerId:j.reviewerId}))});
 await tx.officeChatMessage.deleteMany({where:{roomCode:room.code,id:{notIn:room.chat.map(m=>m.id)}}});
 if(room.chat.length)await tx.officeChatMessage.createMany({skipDuplicates:true,data:room.chat.map(m=>({id:m.id,roomCode:room.code,playerId:m.playerId,name:m.name,text:m.text,round:m.round}))});
 await tx.officeActivity.deleteMany({where:{roomCode:room.code,id:{notIn:room.activity.map(m=>m.id)}}});
 if(room.activity.length)await tx.officeActivity.createMany({skipDuplicates:true,data:room.activity.map(m=>({id:m.id,roomCode:room.code,actorId:m.actorId,text:m.text,round:m.round,at:new Date(m.at)}))});
}
function domain(action){try{return action();}catch(error){error.status=error.message.includes('session expired')?401:400;throw error;}}
export async function roomRequest(database,path,data,token,now=()=>Date.now()) {
 return database.$transaction(async tx=>{
  if(['create','practice'].includes(path)){
   const game=new Game(now);const session=domain(()=>path==='practice'?game.practice(data.name,data.faction):game.create(data.name,data.capacity));
   const {r,p}=game.session(session.token);game.connect(p.token);p.lastSeen=now();await writeRoom(tx,game,r);return session;
  }
  let code;
  if(path==='join')code=String(data.code||'').trim().toUpperCase();
  else {
   if(typeof token!=='string'||token.length>100){const error=Error('Your session expired. Please join a room.');error.status=401;throw error;}
   code=(await tx.officeMember.findUnique({where:{sessionHash:sessionHash(token)},select:{roomCode:true}}))?.roomCode;
  }
  if(!code){const error=Error('Your session expired. Please join a room.');error.status=401;throw error;}
  // PostgreSQL serializes concurrent claims/votes/actions even on different Vercel instances.
  const rows=await tx.$queryRaw`SELECT "state" FROM "OfficeRoom" WHERE "code" = ${code} FOR UPDATE`;
  if(!rows.length){const error=Error(path==='join'?'That room was not found. Check your code.':'Your session expired. Please join a room.');error.status=path==='join'?400:401;throw error;}
  const {game,room}=hydrateRoom(rows[0].state,now);
  let changed=false;
  for(const p of room.players){if(!p.bot&&p.connected&&now()-(p.lastSeen??now())>30000){p.connected=false;p.disconnectedAt=p.lastSeen??now();changed=true;}}
  if(path==='join'){
   game.tick();const session=domain(()=>game.join(code,data.name));const {p}=game.session(session.token);game.connect(p.token);p.lastSeen=now();await writeRoom(tx,game,room);return session;
  }
  const {p}=domain(()=>game.session(token));
  // Polling is the heartbeat. A disconnected tab has 30 seconds to reconnect.
  if(!p.connected || room.pausedAt!=null)changed=true;
  if(!p.requestWindow || now()>p.requestWindow.until)p.requestWindow={count:0,until:now()+10000};
  if(++p.requestWindow.count>120){const error=Error('Too many actions. Please slow down.');error.status=429;throw error;}
  // Expire absent seats before reconnecting so a late poll cannot revive them.
  changed=game.tick().length>0||changed;
  domain(()=>game.connect(token));p.lastSeen=now();
  if(path==='action'){domain(()=>game.action(token,data.type,data.data));changed=true;}
  room.revision=(room.revision||0)+1;
  const result=path==='action'&&data.type==='leave'?{ok:true}:game.view(token);
  await writeRoom(tx,game,room,changed);
  if(!changed)await tx.officeMember.updateMany({where:{id:p.id},data:{connected:p.connected,lastSeen:new Date(p.lastSeen)}});
  return result;
 },{maxWait:10000,timeout:20000});
}
