import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createDatabase } from '../database.js';
import { roomRequest, sessionHash } from '../repository.js';
import { createApiHandler } from '../api-handler.js';
const enabled=process.env.RUN_DATABASE_TESTS==='1';
if(enabled){try{process.loadEnvFile();}catch(error){if(error.code!=='ENOENT')throw error;}}
test('independent function instances share rooms, serialize claims, and keep secrets private',{skip:!enabled},async()=>{
 const first=createDatabase(),second=createDatabase(),codes=[];let time=Date.now();const now=()=>time;
 try{
  const a=await roomRequest(first,'create',{name:'Integration host'},undefined,now);codes.push(a.code);
  const b=await roomRequest(second,'join',{code:a.code,name:'Integration guest'},undefined,now);
  await roomRequest(first,'action',{type:'fillSeats'},a.token,now);
  await roomRequest(first,'action',{type:'ready'},a.token,now);
  await roomRequest(second,'action',{type:'ready'},b.token,now);
  let view=await roomRequest(first,'action',{type:'start'},a.token,now);assert.equal(view.phase,'briefing');time=view.deadline+1;
  view=await roomRequest(second,'sync',{},b.token,now);assert.equal(view.phase,'work');
  const job=view.workplace.jobs[0];
  const claims=await Promise.allSettled([roomRequest(first,'action',{type:'claimJob',data:{id:job.id}},a.token,now),roomRequest(second,'action',{type:'claimJob',data:{id:job.id}},b.token,now)]);
  assert.equal(claims.filter(x=>x.status==='fulfilled').length,1);assert.equal(claims.filter(x=>x.status==='rejected').length,1);
  view=await roomRequest(second,'sync',{},b.token,now);assert.equal(view.workplace.jobs[0].status,'in_progress');assert.ok(view.players.every(p=>!p.token&&!p.faction));assert.ok(view.workplace.jobs.every(j=>!j.task.answer));
  await roomRequest(first,'action',{type:'say',data:{text:'Across function instances'}},a.token,now);
  const cold=createDatabase();try{const restored=await roomRequest(cold,'sync',{},b.token,now);assert.equal(restored.chat.at(-1).text,'Across function instances');}finally{await cold.$disconnect();}
  const separate=await roomRequest(second,'create',{name:'Separate office'},undefined,now);codes.push(separate.code);
  const separateView=await roomRequest(second,'sync',{},separate.token,now);assert.equal(separateView.chat.length,0);
  await assert.rejects(roomRequest(second,'action',{type:'claimJob',data:{id:job.id}},separate.token,now));
  assert.ok(await first.officeMember.findUnique({where:{sessionHash:sessionHash(a.token)}}));
  assert.equal((await first.officeAssignment.findUnique({where:{id:job.id}})).status,'in_progress');
  assert.equal(await first.officeChatMessage.count({where:{roomCode:a.code}}),1);
  await roomRequest(second,'action',{type:'leave'},b.token,now);await assert.rejects(roomRequest(first,'sync',{},b.token,now));
 }finally{await first.officeRoom.deleteMany({where:{code:{in:codes}}});await Promise.all([first.$disconnect(),second.$disconnect()]);}
});
test('Vercel rewrite handler accepts parsed bodies, checks origin and restores a practice room',{skip:!enabled},async()=>{
 const database=createDatabase();const handler=createApiHandler(database);const server=http.createServer(handler);let code;
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 async function post(path,data,token,extra={}){return fetch(base+'/api/index?route='+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...extra},body:JSON.stringify(data)});}
 try{
  assert.equal((await fetch(base+'/api/index?route=health')).status,200);
  const response=await post('practice',{name:'Vercel check'});assert.equal(response.status,200);const session=await response.json();code=session.code;
  const synced=await post('sync',{},session.token);assert.equal(synced.status,200);assert.equal((await synced.json()).practice,true);
  assert.equal((await post('action',{type:'nextPhase'},session.token,{Origin:'https://unrelated.example'})).status,403);
  assert.equal((await post('sync',{},'invalid')).status,401);
  assert.equal((await post('action',{type:'say',data:{text:'a'.repeat(9000)}},session.token)).status,413);
  assert.equal((await post('action',{type:'nextPhase'},session.token)).status,200);
  // Vercel supplies req.body already parsed, unlike Node's streaming HTTP request.
  let status,payload;await handler({url:'/api/index?route=sync',method:'POST',headers:{authorization:'Bearer '+session.token},body:{}},{writeHead(s){status=s;},end(body){payload=JSON.parse(body);}});assert.equal(status,200);assert.equal(payload.phase,'work');
 }finally{await new Promise(resolve=>server.close(resolve));if(code)await database.officeRoom.deleteMany({where:{code}});await database.$disconnect();}
});
