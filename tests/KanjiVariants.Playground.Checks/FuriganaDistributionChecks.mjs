import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
await fs.mkdir(path.join(root,'artifacts'),{recursive:true});
const sandbox=await fs.mkdtemp(path.join(root,'artifacts/furigana-distribution-checks-'));
const vendor=path.join(sandbox,'furigana/lindera-6.2.0');
await fs.cp(path.join(root,'src/KanjiVariants.Playground/wwwroot/furigana/lindera-6.2.0'),vendor,{recursive:true});
const run=()=>spawnSync(process.execPath,[path.join(root,'scripts/Verify-FuriganaLicenseEvidence.mjs'),sandbox],{encoding:'utf8'});
assert.equal(run().status,0,'Valid source-managed distribution');
const originalManifest=JSON.parse(await fs.readFile(path.join(vendor,'manifest.json')));
const officialManifest=structuredClone(originalManifest);
officialManifest.wasm.sha256='52f4b492f9dd0edf876b90d3432ae2284b2d996bf8e697327d1fc3b0277e6431';
officialManifest.wasm.bytes=1784285;
const corruptWasm=await fs.readFile(path.join(vendor,'lindera_wasm_bg.wasm'));corruptWasm[12]^=1;
const checks=[
 ['official-wasm-config','manifest.json',Buffer.from(JSON.stringify(officialManifest))],
 ['wasm-tamper','lindera_wasm_bg.wasm',corruptWasm],
 ['notice-tamper','KANARIA-LICENSE.txt',Buffer.from('invalid notice')],
 ['lock-tamper','SELF-BUILD-CARGO.lock',Buffer.from('invalid lock')],
 ['provenance-tamper','SELF-BUILD-PROVENANCE.json',Buffer.from('{}')],
 ['origin-tamper','manifest.json',Buffer.from((await fs.readFile(path.join(vendor,'manifest.json'),'utf8')).replace('"buildOrigin": "self-built"','"buildOrigin": "official-npm"'))]
];
for(const [name,file,bytes] of checks){const original=await fs.readFile(path.join(vendor,file));try{await fs.writeFile(path.join(vendor,file),bytes);assert.notEqual(run().status,0,name+' must fail closed');}finally{await fs.writeFile(path.join(vendor,file),original);}}
assert.equal(run().status,0,'Restored distribution');
console.log('Distribution checks passed: valid artifacts, official WASM rejection, notice/lock/provenance/origin tampering.');
