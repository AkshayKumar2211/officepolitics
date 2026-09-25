import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createDatabase } from './database.js';
import { createApiHandler } from './api-handler.js';
try{process.loadEnvFile();}catch(error){if(error.code!=='ENOENT')throw error;}
const database=createDatabase(),api=createApiHandler(database);
const files={'/':'index.html','/app.js':'app.js','/styles.css':'styles.css','/progress.js':'progress.js','/scene.js':'scene.js','/game.css':'game.css'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname.startsWith('/api/'))return api(req,res);
 const file=files[url.pathname];if(req.method!=='GET'||!file){res.writeHead(404);return res.end('Not found');}
 try{const content=await readFile(new URL('./public/'+file,import.meta.url));res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css':'text/javascript','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'"});res.end(content);}catch{res.writeHead(500);res.end('Unable to load the page.');}
});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{server.close(async()=>{await database.$disconnect();process.exit(0);});setTimeout(()=>process.exit(1),15000).unref();});
const port=Number(process.env.PORT||3000);
server.listen(port,process.env.HOST||'0.0.0.0',()=>console.log(`Office Politics is open at http://localhost:${port}`));
