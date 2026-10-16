// Package exactly the P2a-verified artifacts; never resolve "latest".
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {pins} from './FuriganaSelfBuildPolicy.mjs';
import {requireCleanArtifact} from './Verify-FuriganaPaths.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(root,'experiments/furigana-p2a/vendor');
const target=path.join(root,'src/KanjiVariants.Playground/wwwroot/furigana/lindera-6.2.0');
const build=path.resolve(root,process.argv[2]??'artifacts/furigana-self-build/pkg-normalized');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const [file,expected] of [
 ['lindera-ipadic-6.2.0.zip','5ed4bba6b429030b0387df67d40d5751d35dedef0306f4bac6d957cad5f04b72'],
])if(hash(await fs.readFile(path.join(source,file)))!==expected)throw new Error('Unverified artifact: '+file);
for(const [file,expected] of [['lindera_wasm.js',pins.javascript],['lindera_wasm_bg.wasm',pins.wasm]])if(hash(await fs.readFile(path.join(build,file)))!==expected)throw new Error('Unreviewed self-build: '+file);
for(const file of ['lindera_wasm.js','lindera_wasm_bg.wasm'])requireCleanArtifact(await fs.readFile(path.join(build,file)),{wasm:file.endsWith('.wasm')});
await fs.mkdir(target,{recursive:true});
let previous;
try {previous=JSON.parse(await fs.readFile(path.join(target,'manifest.json')));} catch(error) {if(error.code!=='ENOENT')throw error;}
if(previous?.licenseAudit?.scopedAttestation)throw new Error('Scoped attestation exists; do not automatically refresh adopted assets or evidence. A new artifact requires a separate review.');
const manifest={engine:'lindera-wasm',version:'6.2.0',dictionaryId:'lindera-ipadic-6.2.0',dictionaryFormat:2,
 publicationApproved:false,publicationBlockers:previous?.licenseAudit ? previous.publicationBlockers : ['固定配布物のライセンス監査・第三者通知の確認が未完了'],dictionary:[]};
if(previous?.licenseAudit)manifest.licenseAudit=previous.licenseAudit;
if(previous?.buildOrigin!=='self-built')throw new Error('Adopt the reviewed self-build provenance first. No official fallback.');
manifest.buildOrigin=previous.buildOrigin;manifest.buildProvenance=previous.buildProvenance;
if(hash(await fs.readFile(path.join(target,manifest.buildProvenance.file)))!==pins.provenance)throw new Error('Build provenance changed');
for(const file of ['lindera_wasm.js','lindera_wasm_bg.wasm','LICENSE']) {
 const bytes=await fs.readFile(file==='LICENSE'?path.join(source,'lindera/package',file):path.join(build,file));await fs.writeFile(path.join(target,file),bytes);
 if(file.endsWith('.wasm'))manifest.wasm={file,sha256:hash(bytes),bytes:bytes.length};
 if(file.endsWith('.js'))manifest.javascript={file,sha256:hash(bytes),bytes:bytes.length};
}
for(const file of ['metadata.json','dict.trie','dict.valsidx','dict.vals','dict.wordsidx','dict.words','matrix.mtx','char_def.bin','unk.bin']) {
 const bytes=await fs.readFile(path.join(source,'ipadic/lindera-ipadic',file)),gzip=zlib.gzipSync(bytes,{level:9});
 const fixed=previous.dictionary.find(a=>a.file===file+'.gz');
 if(!fixed||hash(bytes)!==fixed.rawSha256||hash(gzip)!==fixed.sha256)throw new Error('Pinned dictionary would change: '+file);
 await fs.writeFile(path.join(target,file+'.gz'),gzip);
 manifest.dictionary.push({file:file+'.gz',gzip:true,sha256:hash(gzip),rawSha256:hash(bytes),bytes:gzip.length,rawBytes:bytes.length});
}
await fs.copyFile(path.join(source,'ipadic/lindera-ipadic/NOTICE.txt'),path.join(target,'IPADIC-NOTICE.txt'));
await fs.writeFile(path.join(target,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Prepared pinned assets; publication approval remains false.');
