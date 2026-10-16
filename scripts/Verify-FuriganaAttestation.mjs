import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {pins} from './FuriganaSelfBuildPolicy.mjs';
import {reviewRoots, claims, exclusions} from './FuriganaAttestationRoots.mjs';
import {projectCompilerLog, variantsFor} from './FuriganaBuildEvidence.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const json=async f=>JSON.parse(await fs.readFile(f,'utf8'));
const same=(a,b,label)=>assert.deepEqual(a,b,label);
function contained(base,file) {
 assert.equal(typeof file,'string'); assert(!file.includes('\\')&&!file.split('/').includes('..')&&!path.isAbsolute(file),'Unsafe evidence path');
 const resolved=path.resolve(base,file); assert(resolved.startsWith(path.resolve(base)+path.sep),'Evidence escapes root'); return resolved;
}
async function checkedFile(base,record) {
 const b=await fs.readFile(contained(base,record.file)); assert.equal(sha(b),record.sha256,'Evidence hash: '+record.file); return b;
}
export async function verifyAttestation(options={}) {
 const vendor=options.vendor??path.join(root,'src/KanjiVariants.Playground/wwwroot/furigana/lindera-6.2.0');
 const policyBytes=await fs.readFile(options.policy??path.join(root,'scripts/furigana-attestation-policy.json'));
 assert.equal(sha(policyBytes),reviewRoots.policy,'Reviewed policy changed; explicit root review required');
 const policy=JSON.parse(policyBytes);
 same(policy.schemaVersion,1); same(policy.profile,'recorded-build-inputs-and-artifact-identity/v1');
 same(policy.claims,claims); same(policy.exclusions,exclusions);
 const recordBytes=await fs.readFile(path.join(vendor,'attestation-v1/ATTESTATION.json'));
 assert.equal(sha(recordBytes),reviewRoots.attestation,'Reviewed post-hoc record changed');
 const a=JSON.parse(recordBytes);
 same(a.schemaVersion,1); same(a.profile,policy.profile); same(a.kind,'post-hoc-local-review');
 same(a.claims,claims); same(a.exclusions,exclusions); same(a.knownMissingNotices,[]);
 assert.equal(a.provenance.sha256,pins.provenance);
 const p=JSON.parse(await checkedFile(vendor,a.provenance));
 same(p.completeness.binarySbom,false); same(a.build,p.build); same(a.toolchain,p.toolchain);
 same(a.source,p.source); same(a.repeatBuild,p.repeatBuild); same(a.dependencies,p.dependencies);
 same(a.subjects.wasm.sha256,pins.wasm); same(a.subjects.javascript.sha256,pins.javascript);
 const m=await json(path.join(vendor,'manifest.json'));
 same(m.buildOrigin,'self-built'); same(m.licenseAudit.binaryAttested,false);
 same(m.licenseAudit.sbomCompleteness.status,'unproven'); same(m.licenseAudit.sbomCompleteness.binaryAttested,false);
 same(m.licenseAudit.scopedAttestation,{profile:policy.profile,file:'attestation-v1/ATTESTATION.json',sha256:reviewRoots.attestation,status:'verified-scoped-inputs'});
 same(m.licenseAudit.status,'scoped-attestation-verified');
 same(m.licenseAudit.noticeFulfillment.status,'satisfied-for-fixed-source-scope');
 same(m.licenseAudit.buildProvenance.status,'recorded-self-build');
 same(m.licenseAudit.noticeFulfillment.unresolved,[]);
 same(a.subjects.dictionary,m.dictionary); same(a.subjects.wasm,m.wasm); same(a.subjects.javascript,m.javascript);
 for(const f of [a.subjects.wasm,a.subjects.javascript,...a.subjects.dictionary])await checkedFile(vendor,f);
 same(sha(await fs.readFile(path.join(vendor,'SELF-BUILD-CARGO.lock'))),pins.lock);
 same(a.notices,m.licenseAudit.noticeFiles);
 for(const f of a.notices)await checkedFile(vendor,f);
 const standard=JSON.parse(await checkedFile(vendor,a.standardLibrary.review));
 const supplements=JSON.parse(await checkedFile(vendor,a.standardLibrary.supplementSources));
 same(standard.schemaVersion,1);same(standard.rustCommit,p.toolchain.rustCommit);
 same(standard.knownMissingNotices,[]);same(standard.packages.length,49);
 for(const f of standard.sourceFiles)await checkedFile(vendor,f);
 const lockText=(await fs.readFile(path.join(vendor,'attestation-v1/rust-source/library/Cargo.lock'),'utf8'));
 const lockPackages=lockText.split('[[package]]').slice(1).map(b=>({name:b.match(/^name = "([^"]+)"/m)[1],version:b.match(/^version = "([^"]+)"/m)[1]}));
 same(standard.packages.map(({name,version})=>({name,version})),lockPackages);
 for(const entry of supplements) {
  const item=standard.packages.find(x=>x.name===entry.name&&x.version===entry.version);
  same(entry.archiveSha256,item?.checksum,'Supplement source checksum from fixed Rust lock');
  same(item.notices,entry.files.map(f=>({file:'attestation-v1/'+f.file,sha256:f.sha256})));
 }
 same(a.standardLibrary.inputs,p.standardLibraryArtifacts.files); same(a.standardLibrary.inputs.length,54);
 const classified=standard.packages.flatMap(x=>x.inputFiles).sort();same(classified,a.standardLibrary.inputs.map(f=>f.file).sort());
 for(const item of standard.packages) {
  assert(item.notices.length&&item.reason&&item.classification);
  for(const f of item.notices)await checkedFile(vendor,f);
  if(item.source&&item.notices.some(f=>f.file==='rust-1.98.1/COPYRIGHT-library.html')) {
   const html=await fs.readFile(path.join(vendor,'rust-1.98.1/COPYRIGHT-library.html'),'utf8');
   assert(html.includes(item.name+'-'+item.version+'</h3>'),'Versioned Rust notice missing');
  }
 }
 same(a.compilerLogs.map(x=>x.originalSha256),p.compilerEvidence.compilerArtifactHashes);
 same(a.commandLogs.map(x=>x.originalSha256),p.compilerEvidence.commandEvidence.map(x=>x.sha256));
 same(a.dependencies.length,106);
 for(const log of a.compilerLogs) {
  const rows=JSON.parse(await checkedFile(vendor,log.projection)); same(rows.length,122);
  same(new Set(rows.map(r=>r.package)).size,106);
  for(const dependency of a.dependencies) {
   const id=dependency.name+'@'+dependency.version;
   same(variantsFor(rows,id).map(v=>JSON.stringify(v)).sort(),dependency.compiledVariants.map(v=>JSON.stringify(v)).sort(),'Compiled variants: '+id);
   same([...new Set(rows.filter(r=>r.package===id).map(r=>r.source))],[dependency.source==='fixed Lindera source'?'fixed-lindera-workspace':dependency.source]);
  }
  if(options.rawEvidence) {
   const bytes=await fs.readFile(path.join(options.rawEvidence,log.originalSha256+'.jsonl'));
   same(sha(bytes),log.originalSha256,'Preserved original Cargo log');same(projectCompilerLog(bytes),rows);
  }
 }
 if(options.rawEvidence) {
  for(const log of a.commandLogs) {
   const bytes=await fs.readFile(path.join(options.rawEvidence,log.originalSha256+'.log'));
   same(sha(bytes),log.originalSha256,'Preserved original command log');
   const command=bytes.toString().split('\n').find(x=>x.includes('--crate-name lindera_wasm'));
   assert(command);for(const mapping of p.build.pathRemapping.mappings)assert(command.includes('='+mapping.to));
  }
  const local=path.resolve(options.rawEvidence,'..');
  same(sha(await fs.readFile(path.join(root,'artifacts/license-audit/lindera-v6.2.0.zip'))),pins.sourceArchive,'Retained fixed Lindera source archive');
  for(const [file,expected] of [
   ['target-normalized/wasm32-unknown-unknown/release/lindera_wasm.wasm',p.build.rawCargoWasmSha256],
   ['tools/wasm-bindgen-0.2.126-x86_64-pc-windows-msvc/wasm-bindgen.exe',p.toolchain.bindgenExeSha256],
   ['bindgen-cli.tar.gz',p.toolchain.bindgenArchiveSha256],
   ...['pkg-normalized','pkg-normalized-repeat'].flatMap(d=>[['lindera_wasm_bg.wasm',pins.wasm],['lindera_wasm.js',pins.javascript]].map(([f,h])=>[d+'/'+f,h]))]) {
   same(sha(await fs.readFile(contained(local,file))),expected,'Preserved build/tool/output: '+file);
  }
 }
 // The official archive is checked in CI too. No Rust build, rustup or executable extraction.
 same(a.standardLibrary.component,reviewRoots.standardComponent);
 const inputs=options.inputs??path.join(root,'artifacts/furigana-attestation-inputs');
 await fs.mkdir(inputs,{recursive:true}); const archive=path.join(inputs,'rust-std-1.98.1-wasm32-unknown-unknown.tar.xz');
 try {await fs.access(archive);} catch {
  assert(options.fetchInputs,'Official std archive missing; pass --fetch-inputs to fetch the pinned input');
  const response=await fetch(reviewRoots.standardComponent.url,{signal:AbortSignal.timeout(120000)}); assert(response.ok,'Official std archive download failed');
  const bytes=Buffer.from(await response.arrayBuffer());same(sha(bytes),reviewRoots.standardComponent.sha256);await fs.writeFile(archive,bytes);
 }
 same(sha(await fs.readFile(archive)),reviewRoots.standardComponent.sha256,'Official standard library archive');
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'furigana-std-'));
 try {
  const prefix='rust-std-1.98.1-wasm32-unknown-unknown/rust-std-wasm32-unknown-unknown/lib/rustlib/wasm32-unknown-unknown/lib';
  const result=spawnSync('tar',['-xf',archive,'-C',temp,prefix],{encoding:'utf8'});
  same(result.status,0,'Extract pinned target component: '+result.stderr);
  for(const f of a.standardLibrary.inputs) {
   const b=await checkedFile(path.join(temp,prefix),f);same(b.length,f.bytes);
  }
 } finally {await fs.rm(temp,{recursive:true,force:true});}
 if(options.publishRoot) {
  const published=path.join(options.publishRoot,'furigana/lindera-6.2.0');
  for(const f of [{file:'manifest.json'}, {file:'attestation-v1/ATTESTATION.json'},...a.notices,...a.compilerLogs.map(x=>x.projection),a.standardLibrary.review,a.standardLibrary.supplementSources,...standard.sourceFiles,a.subjects.wasm,a.subjects.javascript,...a.subjects.dictionary]) {
   same(await fs.readFile(contained(published,f.file)),await fs.readFile(contained(vendor,f.file)),'Published bytes: '+f.file);
  }
 }
 return {profile:a.profile,dependencies:106,compilerRecordsPerBuild:122,standardInputs:54,standardLockCandidates:49,
  knownMissingNotices:0,rawEvidenceRechecked:!!options.rawEvidence,publishRechecked:!!options.publishRoot,
  limitations:a.exclusions,publicationApproved:m.publicationApproved};
}
export function requirePublication(manifest) {
 assert.equal(manifest.publicationApproved,true,'publicationApproved=false: owner approval is required; upload/deploy prohibited');
 same(manifest.publicationBlockers,[],'Unresolved publication blockers');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 try {
  const options={},names={'--vendor':'vendor','--policy':'policy','--inputs':'inputs','--raw-evidence':'rawEvidence','--publish-root':'publishRoot'};
  for(let i=2;i<process.argv.length;i++) {
   const arg=process.argv[i];if(arg==='--fetch-inputs')options.fetchInputs=true;
   else if(arg==='--require-publication')options.requirePublication=true;
   else {assert(names[arg]&&process.argv[i+1],'Unknown/missing option: '+arg);options[names[arg]]=path.resolve(process.argv[++i]);}
  }
  console.log(JSON.stringify(await verifyAttestation(options),null,2));
  if(options.requirePublication)requirePublication(await json(path.join(options.vendor??path.join(root,'src/KanjiVariants.Playground/wwwroot/furigana/lindera-6.2.0'),'manifest.json')));
 } catch(e) {console.error('Scoped attestation rejected: '+e.message);process.exitCode=1;}
}
