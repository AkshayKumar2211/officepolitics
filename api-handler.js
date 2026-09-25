import { roomRequest } from './repository.js';
const send=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','Vercel-CDN-Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
export function createApiHandler(database){
 return async(req,res)=>{
  try{
   const url=new URL(req.url,'http://localhost');
   const path=url.searchParams.get('route')||url.pathname.replace(/^\/api\//,'');
   if(path==='health'&&req.method==='GET'){await database.$queryRaw`SELECT 1`;return send(res,200,{ok:true});}
   if(req.method!=='POST')return send(res,405,{error:'Use POST for game requests.'});
   if(!['create','practice','join','session','sync','action'].includes(path))return send(res,404,{error:'Endpoint not found.'});
   if(req.headers.origin){const origin=new URL(req.headers.origin);if(origin.host!==req.headers.host)return send(res,403,{error:'Cross-origin requests are not allowed.'});}
   let data=req.body;
   if(data===undefined){let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>8192)return send(res,413,{error:'Request too large.'});}try{data=JSON.parse(body);}catch{return send(res,400,{error:'Invalid JSON.'});}}
   else if(typeof data==='string'){if(Buffer.byteLength(data)>8192)return send(res,413,{error:'Request too large.'});try{data=JSON.parse(data);}catch{return send(res,400,{error:'Invalid JSON.'});}}
   if(!data||typeof data!=='object'||Array.isArray(data))return send(res,400,{error:'Invalid request.'});
   if(Buffer.byteLength(JSON.stringify(data))>8192)return send(res,413,{error:'Request too large.'});
   const token=req.headers.authorization?.replace(/^Bearer /,'');
   return send(res,200,await roomRequest(database,path,data,token));
  }catch(error){if(error.status)return send(res,error.status,{error:error.message});console.error('Game database request failed:',error.code||error.name);return send(res,503,{error:'The office connection is temporarily unavailable. Please retry.'});}
 };
}
