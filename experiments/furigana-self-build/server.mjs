import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../artifacts/furigana-self-build-site');
const prefix='/KanjiVariants.Playground/';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.wasm':'application/wasm','.css':'text/css','.txt':'text/plain; charset=utf-8'};
http.createServer(async(req,res)=>{
 try {
  const address=new URL(req.url,'http://127.0.0.1');
  if(!address.pathname.startsWith(prefix)){res.writeHead(404);res.end();return;}
  const relative=decodeURIComponent(address.pathname.slice(prefix.length));
  const file=path.resolve(root,relative+(relative.endsWith('/')?'index.html':''));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  const bytes=await fs.readFile(file);
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]??'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end();}
}).listen(5177,'127.0.0.1',()=>console.log('Experimental app: http://127.0.0.1:5177/KanjiVariants.Playground/self/'));
