// Build disposable local app copies. Production wwwroot is never written.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const published=path.join(root,'artifacts/furigana-notices-final-publish/wwwroot');
const site=path.join(root,'artifacts/furigana-self-build-site');
for(const variant of ['official','self']) {
 const target=path.join(site,variant);await fs.cp(published,target,{recursive:true});
 const index=path.join(target,'index.html');let html=await fs.readFile(index,'utf8');
 html=html.replace(/<base href="[^"]*"\s*\/>/,`<base href="/KanjiVariants.Playground/${variant}/" />`);
 html=html.replace('<body>','<body><p style="padding:12px;background:#fff3bf;color:#222">ローカル検証用 '+variant+' — 本番配布物ではありません</p>');
 await fs.writeFile(index,html);
 if(variant==='self') {
  const vendor=path.join(target,'furigana/lindera-6.2.0');const manifest=JSON.parse(await fs.readFile(path.join(vendor,'manifest.json')));
  for(const [file,key] of [['lindera_wasm.js','javascript'],['lindera_wasm_bg.wasm','wasm']]) {
   const bytes=await fs.readFile(path.join(root,'artifacts/furigana-self-build/pkg',file));
   await fs.writeFile(path.join(vendor,file),bytes);manifest[key].bytes=bytes.length;manifest[key].sha256=crypto.createHash('sha256').update(bytes).digest('hex');
  }
  manifest.experimentalSelfBuild=true;manifest.publicationApproved=false;
  await fs.writeFile(path.join(vendor,'manifest.json'),JSON.stringify(manifest,null,2));
 }
}
await fs.mkdir(path.join(site,'bench'),{recursive:true});
await fs.copyFile(path.join(root,'experiments/furigana-self-build/bench.html'),path.join(site,'bench/index.html'));
await fs.copyFile(path.join(root,'experiments/furigana-self-build/bench-worker.mjs'),path.join(site,'bench/bench-worker.mjs'));
await fs.copyFile(path.join(root,'tests/KanjiVariants.Playground.Checks/FuriganaAutomaticTokens.json'),path.join(site,'fixtures.json'));
console.log('Created disposable official/self Blazor sites; production unchanged.');
