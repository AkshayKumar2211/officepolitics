import { randomUUID } from 'node:crypto';
import { TASKS } from './content.js';
export const STATIONS = [
 {id:'engineering',name:'Engineering',x:0,y:1,icon:'💻'},
 {id:'finance',name:'Finance desk',x:11,y:1,icon:'🧾'},
 {id:'studio',name:'Creative studio',x:0,y:6,icon:'🎨'},
 {id:'operations',name:'Operations',x:11,y:6,icon:'📦'},
 {id:'kitchen',name:'Break room',x:5,y:0,icon:'☕'},
];
const stationFor = category => ['Finance'].includes(category)?'finance':['Engineering','Support'].includes(category)?'engineering':['Design','Marketing','Product','Research'].includes(category)?'studio':'operations';
const fail = text => {throw Error(text);};
export function ensureWorkplace(r) {
 r.jobs ??= []; r.activity ??= []; r.morale ??= 70;
 for(const p of r.players){p.energy ??= 3;p.reputation ??= 0;p.department ??= stationFor(['Engineering','Design','People','Product','Operations','Operations','Finance','Marketing','Operations','Support'][r.players.indexOf(p)]||'Operations');}
}
export function officeNotice(game,r,text,actorId=null){r.activity.push({id:randomUUID(),text,actorId,round:r.round,at:game.now()});r.activity=r.activity.slice(-60);}
export function startOfficeDay(game,r){
 ensureWorkplace(r);
 r.jobs=Array.from({length:3},(_,i)=>{const type=(24+(r.round-1)*3+i)%TASKS.length;return {id:randomUUID(),type,station:stationFor(TASKS[type].category),status:'open',ownerId:null,reviewerId:null,round:r.round};});
 for(const p of r.players){p.energy=3;p.breakUsed=false;p.kudosUsed=false;p.politicsUsed=false;}
 officeNotice(game,r,'New client requests have landed. Claim a ticket, complete it at its station, and get a colleague to review it.');
}
export function workplaceView(r,p){
 ensureWorkplace(r);
 return {stations:STATIONS,morale:r.morale,activity:r.activity,jobs:r.jobs.map(job=>{const {answer,...task}=TASKS[job.type];return {...job,task};}),energy:p.energy,reputation:p.reputation,breakUsed:!!p.breakUsed,kudosUsed:!!p.kudosUsed,politicsUsed:!!p.politicsUsed};
}
export function workplaceAction(game,r,p,type,data){
 if(!['claimJob','handoffJob','submitJob','reviewJob','takeBreak','kudos','officePolitics'].includes(type))return false;
 ensureWorkplace(r);
 if(!p.alive || r.phase!=='work' || (r.deadline && game.now()>=r.deadline))fail('Office assignments and networking are available during work time.');
 const job=r.jobs.find(j=>j.id===data.id);
 const target=r.players.find(x=>x.id===data.target && x.id!==p.id && x.alive && x.connected);
 const near = id => {const s=STATIONS.find(x=>x.id===id);return s && Math.abs(p.x-s.x)+Math.abs(p.y-s.y)<=1;};
 if(type==='claimJob'){
  if(!job || job.status!=='open')fail('Someone already claimed this assignment.');
  if(r.jobs.some(j=>j.ownerId===p.id&&j.status==='in_progress'))fail('Finish or hand off your current assignment first.');
  job.ownerId=p.id;job.status='in_progress';officeNotice(game,r,`${p.name} picked up ${TASKS[job.type].title}.`,p.id);
 } else if(type==='handoffJob'){
  if(!job||job.ownerId!==p.id||job.status!=='in_progress'||!target)fail('Choose a connected colleague for your active assignment.');
  if(r.jobs.some(j=>j.ownerId===target.id&&j.status==='in_progress'))fail('That colleague already has an active assignment.');
  job.ownerId=target.id;officeNotice(game,r,`${p.name} handed ${TASKS[job.type].title} to ${target.name}.`,p.id);
 } else if(type==='submitJob'){
  if(!job||job.ownerId!==p.id||job.status!=='in_progress')fail('Claim this assignment before submitting it.');
  if(!near(job.station))fail('Walk to the assignment’s office station first.');
  if(p.energy<1)fail('Take your break to recover energy.');
  if(JSON.stringify(data.answer)!==JSON.stringify(TASKS[job.type].answer))fail('Check the brief and try again.');
  p.energy--;job.status='review';job.submittedAt=game.now();officeNotice(game,r,`${p.name} submitted ${TASKS[job.type].title}. A second pair of eyes is needed.`,p.id);
 } else if(type==='reviewJob'){
  if(!job||job.status!=='review'||job.ownerId===p.id)fail('A different colleague must review a submitted assignment.');
  if(JSON.stringify(data.answer)!==JSON.stringify(TASKS[job.type].answer))fail('Read the brief carefully before signing off.');
  job.status='done';job.reviewerId=p.id;p.reputation+=2;const owner=r.players.find(x=>x.id===job.ownerId);if(owner)owner.reputation+=4;
  r.progress=Math.min(100,r.progress+6);r.morale=Math.min(100,r.morale+3);officeNotice(game,r,`${p.name} signed off ${TASKS[job.type].title}. +6% progress; credit shared with ${owner?.name||'the author'}.`,p.id);
 } else if(type==='takeBreak'){
  if(p.breakUsed||!near('kitchen'))fail('Take one break per workday at the break room.');
  p.breakUsed=true;p.energy=Math.min(3,p.energy+2);r.morale=Math.min(100,r.morale+2);officeNotice(game,r,`${p.name} took a proper break. +2 team morale.`,p.id);
 } else if(type==='kudos'){
  if(p.kudosUsed||!target)fail('Give kudos to one connected colleague per workday.');
  p.kudosUsed=true;target.reputation+=2;r.morale=Math.min(100,r.morale+2);officeNotice(game,r,`${p.name} publicly thanked ${target.name}. +2 reputation and +2 team morale.`,p.id);
 } else {
  if(p.politicsUsed)fail('Choose one office-politics move per workday.');
  if(data.move==='network'){
   if(!target)fail('Choose a colleague to network with.');
   p.reputation+=1;target.reputation+=1;officeNotice(game,r,`${p.name} built an alliance with ${target.name}. Both gain 1 reputation; alliances do not prove innocence.`,p.id);
  } else if(data.move==='credit'){
   if(!job||job.status!=='done'||job.ownerId===p.id)fail('Choose another colleague’s completed assignment.');
   p.reputation+=3;const owner=r.players.find(x=>x.id===job.ownerId);if(owner)owner.reputation=Math.max(0,owner.reputation-2);r.morale=Math.max(0,r.morale-5);officeNotice(game,r,`${p.name} claimed the spotlight for ${TASKS[job.type].title}. The signed record still credits its original author. −5 team morale.`,p.id);
  } else fail('Choose networking or a credit claim.');
  p.politicsUsed=true;
 }
 return true;
}
export function closeOfficeDay(game,r){
 ensureWorkplace(r);const missed=r.jobs.filter(j=>j.status!=='done').length;
 if(missed){r.morale=Math.max(0,r.morale-missed*4);officeNotice(game,r,`${missed} client assignment(s) missed the deadline. −${missed*4} team morale. Missed work is not proof of sabotage.`);}
}
