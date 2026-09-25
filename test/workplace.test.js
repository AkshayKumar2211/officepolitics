import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../game.js';
import { TASKS } from '../content.js';
import { STATIONS } from '../workplace.js';
function setup(){let time=100000;const game=new Game(()=>time);const s=game.practice('Alex');const {r,p}=game.session(s.token);game.phase(r,'work');return{game,r,p,advance:ms=>time+=ms};}
const atStation=(p,id)=>{const station=STATIONS.find(s=>s.id===id);p.x=station.x;p.y=station.y;};
test('shared assignments require ownership, correct answers, proximity and independent review',()=>{
 const {game,r,p}=setup(),j=r.jobs[0],other=r.players[1];
 assert.ok(game.view(p.token).workplace.jobs.every(j=>!('answer' in j.task)));
 game.action(p.token,'claimJob',{id:j.id});assert.throws(()=>game.action(other.token,'claimJob',{id:j.id}));
 assert.throws(()=>game.action(p.token,'submitJob',{id:j.id,answer:TASKS[j.type].answer}));
 atStation(p,j.station);assert.throws(()=>game.action(p.token,'submitJob',{id:j.id,answer:[99]}));
 game.action(p.token,'submitJob',{id:j.id,answer:TASKS[j.type].answer});assert.equal(p.energy,2);assert.equal(j.status,'review');
 assert.throws(()=>game.action(p.token,'reviewJob',{id:j.id,answer:TASKS[j.type].answer}));
 assert.throws(()=>game.action(other.token,'reviewJob',{id:j.id,answer:[99]}));
 game.action(other.token,'reviewJob',{id:j.id,answer:TASKS[j.type].answer});assert.equal(j.status,'done');assert.equal(r.progress,6);assert.equal(p.reputation,4);assert.equal(other.reputation,2);
 assert.throws(()=>game.action(other.token,'reviewJob',{id:j.id,answer:TASKS[j.type].answer}));
});
test('handoffs transfer ownership and disconnected departures release unfinished assignments',()=>{
 const {game,r,p}=setup(),j=r.jobs[0],other=r.players[1];game.action(p.token,'claimJob',{id:j.id});
 assert.throws(()=>game.action(other.token,'handoffJob',{id:j.id,target:p.id}));game.action(p.token,'handoffJob',{id:j.id,target:other.id});assert.equal(j.ownerId,other.id);
 game.action(other.token,'leave');assert.equal(j.status,'open');assert.equal(j.ownerId,null);
});
test('breaks, kudos, networking and credit claims have bounded rewards and tradeoffs',()=>{
 const {game,r,p}=setup(),other=r.players[1];p.energy=1;assert.throws(()=>game.action(p.token,'takeBreak'));atStation(p,'kitchen');game.action(p.token,'takeBreak');assert.equal(p.energy,3);assert.throws(()=>game.action(p.token,'takeBreak'));
 game.action(p.token,'kudos',{target:other.id});assert.equal(other.reputation,2);assert.throws(()=>game.action(p.token,'kudos',{target:other.id}));
 game.action(p.token,'officePolitics',{move:'network',target:other.id});assert.equal(p.reputation,1);assert.equal(other.reputation,3);assert.throws(()=>game.action(p.token,'officePolitics',{move:'network',target:other.id}));
 const j=r.jobs[0];j.status='done';j.ownerId=p.id;p.reputation=4;const before=r.morale;game.action(other.token,'officePolitics',{move:'credit',id:j.id});assert.equal(p.reputation,2);assert.equal(r.morale,before-5);assert.equal(j.ownerId,p.id);
});
test('spectators cannot do office work and day resets clear one-shot perks',()=>{
 const {game,r,p}=setup();p.alive=false;assert.throws(()=>game.action(p.token,'claimJob',{id:r.jobs[0].id}));p.alive=true;p.breakUsed=true;p.kudosUsed=true;p.politicsUsed=true;const jobs=r.jobs.map(j=>j.id);game.day(r);assert.equal(p.breakUsed,false);assert.equal(p.kudosUsed,false);assert.equal(p.politicsUsed,false);assert.ok(r.jobs.every(j=>!jobs.includes(j.id)));
});
test('uncompleted client work reduces morale at deadline and bots can review human work',()=>{
 const {game,r,p}=setup();const j=r.jobs[0];game.action(p.token,'claimJob',{id:j.id});atStation(p,j.station);game.action(p.token,'submitJob',{id:j.id,answer:TASKS[j.type].answer});game.runBots(r,true);assert.equal(j.status,'done');const morale=r.morale;game.advance(r);assert.equal(r.morale,morale-8);
});
test('multiplayer hosts can fill seats with bots while retaining room invites and host restrictions',()=>{
 const game=new Game();const host=game.create('Host');game.connect(host.token);const guest=game.join(host.code,'Guest');game.connect(guest.token);
 assert.throws(()=>game.action(guest.token,'fillSeats'));game.action(host.token,'fillSeats');const {r}=game.session(host.token);assert.equal(r.players.length,5);assert.equal(r.players.filter(p=>p.bot).length,3);assert.equal(!!r.practice,false);game.action(host.token,'ready');game.action(guest.token,'ready');game.action(host.token,'start');assert.equal(r.phase,'briefing');assert.throws(()=>game.action(host.token,'fillSeats'));
});
