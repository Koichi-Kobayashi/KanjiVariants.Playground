// Preserve measured evidence without copying binaries or changing publication approval.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const experiment=path.join(root,'experiments/furigana-self-build');
const build=path.join(root,'artifacts/furigana-self-build');
const vendor=path.join(root,'src/KanjiVariants.Playground/wwwroot/furigana/lindera-6.2.0');
const json=async file=>JSON.parse(await fs.readFile(file,'utf8'));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const hashes={};
for(const file of ['lindera_wasm_bg.wasm','lindera_wasm.js']) {
 const first=await fs.readFile(path.join(build,'pkg',file)),repeat=await fs.readFile(path.join(build,'pkg-repeat',file));
 assert.deepEqual(first,repeat,'Independent output directory rebuild: '+file);
 hashes[file]={bytes:first.length,sha256:sha(first),repeatSha256:sha(repeat)};
}
const comparison=await json(path.join(build,'comparison.json'));
const browser=await json(path.join(build,'browser-comparison.json'));
assert.equal(browser.allTokensEqual,true);
assert.equal(browser.runs.length,6);
const manifest=await json(path.join(vendor,'manifest.json'));
assert.equal(manifest.publicationApproved,false);
const inventory=await json(path.join(vendor,'LICENSE-INVENTORY.json'));
const metadata=await json(path.join(root,'artifacts/license-audit/wasm-metadata-limited.json'));
const logs=(await fs.readFile(path.join(build,'compiler-artifacts.jsonl'),'utf8')).trim().split('\n').map(x=>JSON.parse(x));
const dependencies=[];
for(const p of comparison.compiledPackages) {
 const notice=inventory.packages.find(x=>x.name===p.name&&x.version===p.version);
 const source=metadata.packages.find(x=>x.id===p.packageId);
 const variants=logs.filter(x=>x.reason==='compiler-artifact'&&x.package_id===p.packageId).map(x=>({features:x.features,targetKinds:x.target.kind,platform:x.filenames.some(f=>f.includes('wasm32-unknown-unknown'))?'wasm32-unknown-unknown':'host'}));
 dependencies.push({name:p.name,version:p.version,source:source.source??'fixed Lindera source',archiveSha256:notice.archiveSha256??null,role:notice.role,compiledVariants:[...new Map(variants.map(v=>[JSON.stringify(v),v])).values()],noticeFiles:notice.noticeFiles});
}
dependencies.sort((a,b)=>a.name.localeCompare(b.name)||a.version.localeCompare(b.version));
const published=path.join(root,process.argv[2]??'artifacts/furigana-notices-final-publish/wwwroot');
const notices=[];
for(const n of manifest.licenseAudit.noticeFiles) {
 const hash=sha(await fs.readFile(path.join(published,'furigana/lindera-6.2.0',n.file)));
 assert.equal(hash,n.sha256,'Published notice: '+n.file);
 notices.push({file:n.file,sha256:hash});
}
const {engines}=comparison;
const engineSummary=Object.fromEntries(Object.entries(engines).map(([k,e])=>[k,{jsSha256:e.jsSha256,wasmSha256:e.wasmSha256,jsBytes:e.jsBytes,wasmBytes:e.wasmBytes,gzipWasmBytes:e.gzipWasmBytes,brotliWasmBytes:e.brotliWasmBytes}]));
const sourceComparison=await json(path.join(build,'source-comparison.json'));
assert.equal(sourceComparison.allMatched,true);
const standardLibraryArtifacts=await json(path.join(build,'standard-library-artifacts.json'));
const record={date:'2026-10-12',scope:'Experimental build evidence; NOT a complete binary SBOM or production approval',sourceCommit:inventory.sourceCommit,cargoLockSha256:inventory.cargoLockSha256,sourceArchiveSha256:sha(await fs.readFile(path.join(root,'artifacts/license-audit/lindera-v6.2.0.zip'))),toolchain:{rust:'1.98.1',rustCommit:'48a229ceaefd4985c50990b14116b6d856af0985',cargo:'1.98.1',host:'x86_64-pc-windows-msvc',wasmBindgen:'0.2.126',bindgenArchiveSha256:'5a3773c7e69cfb2d865e235e9210de184c8c3af1787720646ec1a8bbe09c6179',bindgenExeSha256:sha(await fs.readFile(path.join(build,'tools/wasm-bindgen-0.2.126-x86_64-pc-windows-msvc/wasm-bindgen.exe')))},build:{target:'wasm32-unknown-unknown',rootFeatures:[],rootDefaultFeatures:false,locked:true,offline:true,profile:'release',lto:true,optLevel:'s',buildOverrideOptLevel:3,bindgenTarget:'web',wasmOpt:false,rawCargoWasmSha256:sha(await fs.readFile(path.join(build,'target/wasm32-unknown-unknown/release/lindera_wasm.wasm')))},repeatBuild:{sameSourceAndMachine:true,separateTargetDirectory:true,outputs:hashes},compiledPackageCount:dependencies.length,dependencies,engines:engineSummary,tokenComparison:comparison.comparison,browser,publish:{noticeCount:notices.length,allNoticeHashesMatched:true,notices},publicationApproved:false,limitations:['Cargo compiler artifacts omit prebuilt Rust standard-library dependency internals.','Two local builds do not prove cross-machine reproducibility.','Official npm binary build correspondence remains unproven.','Browser performance is desktop localhost experiment, not mobile device or production latency.']};
record.sourceComparison=sourceComparison;
record.standardLibraryArtifacts={scope:'Installed target library inputs, not proof of individual linked contents or their full source dependency versions',files:standardLibraryArtifacts};
await fs.writeFile(path.join(experiment,'MEASUREMENTS.json'),JSON.stringify(record,null,2)+'\n');
console.log(`Recorded ${dependencies.length} compiled package versions/feature variants, two identical builds, ${notices.length} published notice hashes. Approval remains false.`);
