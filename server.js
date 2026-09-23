import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { Game } from './game.js';
const game = new Game(), streams = new Map(), limits = new Map();
const port = Number(process.env.PORT || 3000);
const send = (res, status, value) => { res.writeHead(status, { 'Content-Type':'application/json', 'Cache-Control':'no-store' }); res.end(JSON.stringify(value)); };
function publish(room) { for (const p of room.players) { const stream = streams.get(p.token); if (stream && game.sessions.has(p.token)) stream.write(`data: ${JSON.stringify(game.view(p.token))}\n\n`); } }
const server = http.createServer(async (req,res) => {
 try {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'GET' && url.pathname === '/api/events') {
   const token = url.searchParams.get('token'); const room = game.connect(token);
   streams.get(token)?.end(); streams.set(token,res);
   res.writeHead(200, { 'Content-Type':'text/event-stream', 'Cache-Control':'no-cache, no-transform', 'Connection':'keep-alive', 'X-Accel-Buffering':'no' });
   res.write(': connected\n\n'); publish(room);
   req.on('close', () => { if (streams.get(token) === res) { streams.delete(token); game.disconnect(token); publish(room); } }); return;
  }
  if (req.method === 'POST' && url.pathname.startsWith('/api/')) {
   if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}` && req.headers.origin !== `https://${req.headers.host}`) return send(res,403,{error:'Cross-origin requests are not allowed.'});
   const ip = req.socket.remoteAddress, now = Date.now(); let limit = limits.get(ip);
   if (!limit || now > limit.until) { limit = { count:0, until:now+60000 }; limits.set(ip,limit); }
   if (++limit.count > 300) return send(res,429,{error:'Too many requests. Please wait a moment.'});
   let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 8192) return send(res,413,{error:'Request too large.'}); }
   let data; try { data = JSON.parse(body); } catch { return send(res,400,{error:'Invalid JSON.'}); }
   if (!data || typeof data !== 'object' || Array.isArray(data)) return send(res,400,{error:'Invalid request.'});
   if (url.pathname === '/api/practice') return send(res,200,game.practice(data.name,data.faction));
   if (url.pathname === '/api/create') return send(res,200,game.create(data.name,data.capacity));
   if (url.pathname === '/api/join') return send(res,200,game.join(data.code,data.name));
   if (url.pathname === '/api/session') return send(res,200,game.view(req.headers.authorization?.replace(/^Bearer /,'')));
   if (url.pathname === '/api/action') {
    const token = req.headers.authorization?.replace(/^Bearer /,''); const r = game.action(token,data.type,data.data); publish(r); return send(res,200,{ok:true});
   }
   return send(res,404,{error:'Endpoint not found.'});
  }
  const files = { '/':'index.html', '/app.js':'app.js', '/styles.css':'styles.css', '/progress.js':'progress.js' };
  if (req.method !== 'GET' || !files[url.pathname]) { res.writeHead(404); return res.end('Not found'); }
  const file = files[url.pathname]; const content = await readFile(new URL(`./public/${file}`,import.meta.url));
  res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css':'text/javascript', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer', 'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'"}); res.end(content);
 } catch(error) { if (!res.headersSent) send(res,400,{error:error.message}); else res.end(); }
});
setInterval(() => { for (const r of game.tick()) publish(r); },250).unref();
setInterval(() => { for (const stream of streams.values()) stream.write(': heartbeat\n\n'); for(const [key,value] of limits) if(Date.now()>value.until) limits.delete(key); },15000).unref();
server.listen(port,'0.0.0.0',()=>console.log(`Office Politics is open at http://localhost:${port}`));
