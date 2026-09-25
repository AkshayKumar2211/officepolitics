import { createDatabase } from '../database.js';
import { restoreGame } from '../storage.js';
import { Game } from '../game.js';
import { writeRoom } from '../repository.js';
try{process.loadEnvFile();}catch(error){if(error.code!=='ENOENT')throw error;}
const database=createDatabase();
try{
 await database.$transaction(async tx=>{
  const rows=await tx.$queryRaw`SELECT "payload" FROM "OfficePoliticsSnapshot" WHERE "id" = 'office-politics' FOR UPDATE`;
  if(!rows.length||rows[0].payload.migratedToRooms)return;
  const game=new Game();await restoreGame(game,tx);
  for(const room of game.rooms.values()){
   if(await tx.officeRoom.findUnique({where:{code:room.code},select:{code:true}}))continue;
   for(const p of room.players)if(!p.bot)p.lastSeen=Date.now();
   await writeRoom(tx,game,room);
  }
  await tx.officePoliticsSnapshot.update({where:{id:'office-politics'},data:{payload:{...rows[0].payload,migratedToRooms:true}}});
 },{timeout:60000});
 console.log('Legacy room migration complete.');
}catch(error){console.error('Room migration failed:',error.code||error.name);process.exitCode=1;}finally{await database.$disconnect();}
