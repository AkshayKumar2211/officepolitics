import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../game.js';
import { createPersistence, restoreGame } from '../storage.js';
const setup = () => {let now=100000;const game=new Game(()=>now);const s=game.practice('Alex');const {r,p}=game.session(s.token);return {game,r,p,advance:ms=>now+=ms};};
test('movement validates speed, walls, desks, and meeting restrictions',()=>{
 const {game,r,p,advance}=setup();game.action(p.token,'move',{dx:1,dy:0});assert.equal(p.x,2);
 assert.throws(()=>game.action(p.token,'move',{dx:1,dy:0}));advance(200);
 assert.throws(()=>game.action(p.token,'move',{dx:0,dy:1}));
 assert.throws(()=>game.action(p.token,'move',{dx:99,dy:0}));
 p.x=0;assert.throws(()=>game.action(p.token,'move',{dx:-1,dy:0}));
 game.phase(r,'meeting');assert.throws(()=>game.action(p.token,'move',{dx:1,dy:0}));
});
test('coffee gives a shared bonus once and positions disclose no private role',()=>{
 const {game,r,p,advance}=setup();game.phase(r,'work');p.x=1;p.y=1;
 game.action(p.token,'move',{dx:1,dy:0});assert.equal(p.coffee,1);assert.equal(r.progress,2);assert.equal(r.coffee.length,2);
 advance(200);game.action(p.token,'move',{dx:-1,dy:0});advance(200);game.action(p.token,'move',{dx:1,dy:0});assert.equal(r.progress,2);
 assert.ok(game.view(p.token).players.every(x=>!('token' in x)&&!('faction' in x)));
});
test('chat validates text, cooldown, history limits, and spectator permissions',()=>{
 const {game,r,p,advance}=setup();game.action(p.token,'say',{text:'Hello team!'});assert.equal(r.chat.at(-1).text,'Hello team!');
 assert.throws(()=>game.action(p.token,'say',{text:'spam'}));advance(1600);
 for(const text of ['', 'a'.repeat(241),'hello\nworld']) assert.throws(()=>game.action(p.token,'say',{text}));
 game.action(p.token,'emote',{text:'👋'});assert.equal(game.view(p.token).players[0].emote,'👋');advance(4100);assert.equal(game.view(p.token).players[0].emote,null);
 for(let i=0;i<85;i++){advance(1600);game.action(p.token,'say',{text:'message '+i});}assert.equal(r.chat.length,80);
 p.alive=false;advance(1600);assert.throws(()=>game.action(p.token,'say',{text:'spoiler'}));
});
function memoryDatabase() {
 let row = null;
 return {officePoliticsSnapshot:{
  async findUnique(){return structuredClone(row);},
  async upsert({create,update}){row=structuredClone(row?{...row,...update}:create);},
 }};
}
test('Prisma snapshots restore sessions, private state, and paused timers without reviving revoked sessions',async()=>{
 const database=memoryDatabase();const {game,r,p}=setup();game.phase(r,'work');game.action(p.token,'say',{text:'See you after restart'});const remaining=r.deadline-game.now();
 const bot=r.players.find(x=>x.bot);game.sessions.delete(bot.token);await createPersistence(game,database).save();
 let now=900000;const restored=new Game(()=>now);await restoreGame(restored,database);assert.equal(restored.sessions.has(bot.token),false);
 assert.equal(restored.view(p.token).chat.at(-1).text,'See you after restart');assert.equal(restored.session(p.token).p.connected,false);
 restored.tick();assert.equal(restored.view(p.token).phase,'work');now+=50000;restored.connect(p.token);assert.equal(restored.view(p.token).deadline-now,remaining);
 assert.equal(restored.session(p.token).p.faction,p.faction);
});
test('failed database writes retry and concurrent saves are ordered',async()=>{
 const database=memoryDatabase();const original=database.officePoliticsSnapshot.upsert;let calls=0,active=0;
 database.officePoliticsSnapshot.upsert=async args=>{calls++;assert.equal(active++,0);await new Promise(resolve=>setTimeout(resolve,5));active--;if(calls===1)throw Error('unavailable');return original(args);};
 const {game,p}=setup();const persistence=createPersistence(game,database);
 await assert.rejects(persistence.save());await persistence.save();assert.equal(calls,2);
 await persistence.save();assert.equal(calls,2);
 p.x=7;await Promise.all([persistence.save(),persistence.save()]);assert.equal(calls,3);
 const restored=new Game();await restoreGame(restored,database);assert.equal(restored.session(p.token).p.x,7);
});
test('missing snapshots start empty and malformed snapshots fail without writes',async()=>{
 const database=memoryDatabase();const game=new Game();await restoreGame(game,database);assert.equal(game.rooms.size,0);
 await database.officePoliticsSnapshot.upsert({create:{payload:{version:99}}});await assert.rejects(restoreGame(game,database));assert.equal(game.rooms.size,0);
});

test('idle active timers checkpoint remaining time before a restart',async()=>{
 const database=memoryDatabase();const {game,r,p,advance}=setup();game.phase(r,'work');const persistence=createPersistence(game,database);
 await persistence.save();advance(5000);await persistence.save();const remaining=r.deadline-game.now();
 const restored=new Game(()=>900000);await restoreGame(restored,database);restored.connect(p.token);assert.equal(restored.view(p.token).deadline-restored.now(),remaining);
});
