import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const base='/KanjiVariants.Playground/experiments/furigana-p2a/';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.wasm':'application/wasm','.css':'text/css','.gz':'application/octet-stream'};
const compressed=new Map();
await fs.mkdir(path.join(root,'results'),{recursive:true});
// Compression work is server preparation, not part of browser initialization.
for(const asset of JSON.parse(await fs.readFile(path.join(root,'generated/assets.json'),'utf8'))) {
 if(!asset.path.endsWith('.gz')&&!asset.path.endsWith('.tgz')&&!asset.path.endsWith('.zip')) {
  const file=path.join(root,asset.path);compressed.set(file,zlib.gzipSync(await fs.readFile(file),{level:9}));
 }
}
http.createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,'http://localhost');
  if(url.pathname===base+'save' && req.method==='POST') {
   let body='';for await(const part of req) {body+=part;if(body.length>30_000_000)throw new Error('Result too large');}
   const result=JSON.parse(body);
   const label=String(result.label??'result').replace(/[^a-z0-9_-]/gi,'_');
   await fs.writeFile(path.join(root,'results',label+'.json'),JSON.stringify(result,null,2));
   res.writeHead(200,{'Content-Type':'text/plain'});res.end('saved');return;
  }
  if(!url.pathname.startsWith(base)) {res.writeHead(404);res.end('experiment subpath only');return;}
  let relative=decodeURIComponent(url.pathname.slice(base.length))||'index.html';
  if(relative.startsWith('probe/')) {
   const probePath=relative.slice(6)||'index.html';
   relative=probePath==='index.html'?'InteropProbe/wwwroot/index.html':'InteropProbe/bin/Release/net10.0/wwwroot/'+probePath;
  }
  const file=path.resolve(root,relative);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  let bytes=await fs.readFile(file), encoding=null;
  if(url.searchParams.get('compression')==='gzip' && !file.endsWith('.gz')) {
   encoding='gzip';if(!compressed.has(file))compressed.set(file,zlib.gzipSync(bytes,{level:9}));bytes=compressed.get(file);
  }
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]??'application/octet-stream',
   'Content-Length':bytes.length,'Cache-Control':url.searchParams.get('cache')==='cold'||!relative.startsWith('vendor/')?'no-store':'public, max-age=86400',
   'Timing-Allow-Origin':'*',...(encoding?{'Content-Encoding':encoding}:{})});
  res.end(bytes);
 } catch(error) {res.writeHead(404,{'Content-Type':'text/plain'});res.end(String(error));}
}).listen(Number(process.argv[2]??5175),'localhost',()=>console.log('P2a http://localhost:'+(process.argv[2]??5175)+base));
