// Diagnostic only. A different output is never copied into production.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const build=path.join(root,'artifacts/furigana-self-build');
const vendor=path.join(root,'src/KanjiVariants.Playground/wwwroot/furigana/lindera-6.2.0');
const manifest=JSON.parse(await fs.readFile(path.join(vendor,'manifest.json')));
const arrays=await Promise.all(manifest.dictionary.map(async a=>new Uint8Array(zlib.gunzipSync(await fs.readFile(path.join(vendor,a.file))))));
const fixtures=JSON.parse(await fs.readFile(path.join(root,'tests/KanjiVariants.Playground.Checks/FuriganaAutomaticTokens.json')));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function sections(bytes){let p=8;const result=[];const leb=()=>{let n=0,s=0,v;do{v=bytes[p++];n+=(v&127)*2**s;s+=7;}while(v&128);return n;};while(p<bytes.length){const id=bytes[p++],length=leb(),start=p,end=p+length;let name='';if(id===0){const size=leb();name=bytes.subarray(p,p+size).toString();}result.push({id,name,bytes:length,sha256:sha(bytes.subarray(start,end))});p=end;}return result;}
const result={date:'2026-10-13',scope:'Same Windows toolchain; separate Cargo home and target, NOT independent OS/runner proof',records:[]};
let referenceTokens,referenceImports,referenceExports;
for(const [kind,folder,log] of [['baseline','pkg','compiler-artifacts.jsonl'],['isolated','pkg-isolated','compiler-artifacts-isolated.jsonl'],['remapped','pkg-remapped','compiler-artifacts-remapped.jsonl']]){
 const bytes=await fs.readFile(path.join(build,folder,'lindera_wasm_bg.wasm'));
 const js=await fs.readFile(path.join(build,folder,'lindera_wasm.js'));
 const module=await import(pathToFileURL(path.join(build,folder,'lindera_wasm.js')).href);await module.default({module_or_path:bytes});
 const tokenizer=new module.Tokenizer(module.loadDictionaryFromBytes(...arrays),'normal');
 const tokens=fixtures.map(f=>tokenizer.tokenize(f.Text));tokenizer.free();
 const wm=new WebAssembly.Module(bytes),imports=WebAssembly.Module.imports(wm),exports=WebAssembly.Module.exports(wm);
 if(referenceTokens){assert.deepEqual(tokens,referenceTokens);assert.deepEqual(imports,referenceImports);assert.deepEqual(exports,referenceExports);}else{referenceTokens=tokens;referenceImports=imports;referenceExports=exports;}
 const logBytes=await fs.readFile(path.join(build,log));
 const variants=[...new Set(logBytes.toString().trim().split('\n').map(x=>JSON.parse(x)).filter(x=>x.reason==='compiler-artifact').map(x=>JSON.stringify({package:x.package_id.split('#').at(-1),features:x.features,targetKinds:x.target.kind})))].sort();
 result.records.push({kind,wasmSha256:sha(bytes),wasmBytes:bytes.length,jsSha256:sha(js),compilerLogSha256:sha(logBytes),compiledVariantCount:variants.length,compiledVariantsSha256:sha(JSON.stringify(variants)),sections:sections(bytes),fixtureCount:fixtures.length,tokensEqual:true,wasmApiEqual:true});
}
assert.equal(result.records[0].wasmSha256,result.records[2].wasmSha256,'Path remapping must reproduce the pinned output');
assert.ok(result.records.every(r=>r.compiledVariantsSha256===result.records[0].compiledVariantsSha256));
result.cause='With the isolated Cargo home alone the embedded source paths and code/data/name sections differ. Mapping only that home back to the original path reproduces every byte. No different artifact adopted.';
await fs.writeFile(path.join(root,'experiments/furigana-self-build/REBUILD-COMPARISON.json'),JSON.stringify(result,null,2)+'\n');
console.log('Baseline/isolated/remapped API and 23 raw token sets match; compiled variants match; remapped WASM byte-identical. Diagnostic difference recorded.');
