import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const build=path.join(root,'artifacts/furigana-self-build');
const production=path.join(root,'src/KanjiVariants.Playground/wwwroot/furigana/lindera-6.2.0');
const manifest=JSON.parse(await fs.readFile(path.join(production,'manifest.json')));
const fixtures=JSON.parse(await fs.readFile(path.join(root,'tests/KanjiVariants.Playground.Checks/FuriganaAutomaticTokens.json')));
const bytes=await Promise.all(manifest.dictionary.map(async x=>new Uint8Array(zlib.gunzipSync(await fs.readFile(path.join(production,x.file))))));
const sha=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const engines={};
for(const [kind,directory] of [['official',path.join(root,'experiments/furigana-p2a/vendor/lindera/package')],['self',production]]) {
 const js=await fs.readFile(path.join(directory,'lindera_wasm.js')),binary=await fs.readFile(path.join(directory,'lindera_wasm_bg.wasm'));
 assert.equal(sha(binary),kind==='official'?'52f4b492f9dd0edf876b90d3432ae2284b2d996bf8e697327d1fc3b0277e6431':'fbe6bf9a280f10f7e897fb88d997838c6c1bf1df20bf288ea3df23962a1897ba');
 const start=performance.now(),module=await import(pathToFileURL(path.join(directory,'lindera_wasm.js')).href);
 const wasm=await module.default({module_or_path:binary});
 const dictionary=module.loadDictionaryFromBytes(...bytes),tokenizer=new module.Tokenizer(dictionary,'normal');
 const initializationMs=performance.now()-start;
 const analyses=fixtures.map(f=>({text:f.Text,tokens:tokenizer.tokenize(f.Text)}));
 const timing=[];
 for(const length of [20,500,2000]) {
  const text='今日は図書館で宇宙の本を読みます。'.repeat(120).slice(0,length),samples=[];
  for(let i=0;i<12;i++){const t=performance.now();tokenizer.tokenize(text);if(i)samples.push(performance.now()-t);}
  samples.sort((a,b)=>a-b);timing.push({utf16Length:text.length,medianMs:samples[5]});
 }
 const wm=new WebAssembly.Module(binary);
 engines[kind]={jsSha256:sha(js),wasmSha256:sha(binary),jsBytes:js.length,wasmBytes:binary.length,gzipWasmBytes:zlib.gzipSync(binary,{level:9}).length,brotliWasmBytes:zlib.brotliCompressSync(binary).length,
  initializationMs,wasmLinearBytes:wasm.memory.buffer.byteLength,timing,
  exports:Object.keys(module).sort(),wasmImports:WebAssembly.Module.imports(wm),wasmExports:WebAssembly.Module.exports(wm),analyses};
 tokenizer.free();
}
assert.deepEqual(engines.self.analyses,engines.official.analyses,'all actual raw tokens, UTF-8 positions, details, unknown flags must match');
for(const name of ['default','Tokenizer','loadDictionaryFromBytes'])assert.ok(engines.self.exports.includes(name),'Required API: '+name);
assert.deepEqual(engines.self.exports,engines.official.exports,'JS public export surface');
assert.deepEqual(engines.self.wasmImports,engines.official.wasmImports,'WASM import descriptors');
assert.deepEqual(engines.self.wasmExports,engines.official.wasmExports,'WASM export descriptors');
const compiler=(await fs.readFile(path.join(build,'compiler-artifacts.jsonl'),'utf8')).trim().split('\n').map(x=>JSON.parse(x));
const built=new Map();
for(const message of compiler.filter(x=>x.reason==='compiler-artifact'))built.set(message.package_id,{packageId:message.package_id,features:message.features,targetKinds:message.target.kind});
const inventory=JSON.parse(await fs.readFile(path.join(production,'LICENSE-INVENTORY.json')));
const metadata=JSON.parse(await fs.readFile(path.join(root,'artifacts/license-audit/wasm-metadata-limited.json')));
for(const item of built.values()) {
 const p=metadata.packages.find(p=>p.id===item.packageId);
 assert.ok(p,'Compiled package metadata available');
 assert.ok(inventory.packages.some(x=>x.name===p.name&&x.version===p.version&&x.noticeFiles.length),'Compiled package notice coverage: '+p.name);
 item.name=p.name;item.version=p.version;
}
const result={environment:'Node.js '+process.version+' / Windows; not browser transfer or mobile performance',buildTarget:'wasm32-unknown-unknown',rootFeatures:[],rootDefaultFeatures:false,locked:true,
 comparison:{fixtureCount:fixtures.length,rawTokensEqual:true,jsPublicExportsEqual:true},compiledPackages:[...built.values()],engines};
await fs.writeFile(path.join(build,'comparison.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({comparison:result.comparison,compiledPackages:built.size,engines:Object.fromEntries(Object.entries(engines).map(([k,{analyses,...v}])=>[k,v]))},null,2));
