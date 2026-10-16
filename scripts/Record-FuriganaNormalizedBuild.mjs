// Record candidates after two builds and semantic dependency/privacy comparison.
// Does not adopt assets, update pins or grant publication approval.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {inspectArtifact,requireCleanArtifact} from './Verify-FuriganaPaths.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'artifacts/furigana-self-build');
const vendor=path.join(root,'src/KanjiVariants.Playground/wwwroot/furigana/lindera-6.2.0');
assert.ok(!JSON.parse(await fs.readFile(path.join(vendor,'manifest.json'))).licenseAudit?.scopedAttestation,'Historical recorder cannot overwrite provenance after scoped attestation; review a new profile separately.');
const json=async f=>JSON.parse(await fs.readFile(f,'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function preserveEvidence(bytes,extension){const directory=path.join(output,'normalized-evidence');await fs.mkdir(directory,{recursive:true});await fs.writeFile(path.join(directory,sha(bytes)+extension),bytes);}
const measured=await json(path.join(root,'experiments/furigana-self-build/MEASUREMENTS.json'));
function identity(id){const [source,fragment]=id.split('#');return fragment.includes('@')?fragment:decodeURIComponent(source.split('/').at(-1))+'@'+fragment;}
async function compiled(suffix){const log=await fs.readFile(path.join(output,`compiler-artifacts-normalized${suffix}.jsonl`));const rows=log.toString().trim().split('\n').filter(x=>x.startsWith('{')).map(x=>JSON.parse(x)).filter(x=>x.reason==='compiler-artifact');const map=new Map();for(const row of rows){const id=identity(row.package_id),variant={features:row.features,targetKinds:row.target.kind,platform:row.filenames.some(f=>f.includes('wasm32-unknown-unknown'))?'wasm32-unknown-unknown':'host'};if(!map.has(id))map.set(id,new Map());map.get(id).set(JSON.stringify(variant),variant);}return {logSha256:sha(log),map};}
const first=await compiled(''),repeat=await compiled('-repeat');
for(const suffix of ['','-repeat'])await preserveEvidence(await fs.readFile(path.join(output,`compiler-artifacts-normalized${suffix}.jsonl`)),'.jsonl');
assert.equal(first.map.size,106);assert.equal(repeat.map.size,106);
const dependencies=[];
for(const prior of measured.dependencies){const id=prior.name+'@'+prior.version;const current=first.map.get(id),other=repeat.map.get(id);assert.ok(current&&other,'Dependency version changed: '+id);assert.deepEqual([...current.keys()].sort(),[...other.keys()].sort());assert.deepEqual([...current.keys()].sort(),prior.compiledVariants.map(v=>JSON.stringify(v)).sort(),'Compiled features/kinds changed: '+id);dependencies.push({...prior,compiledVariants:[...current.values()]});}
const outputs={};
for(const file of ['lindera_wasm_bg.wasm','lindera_wasm.js']){const firstBytes=await fs.readFile(path.join(output,'pkg-normalized',file)),repeatBytes=await fs.readFile(path.join(output,'pkg-normalized-repeat',file));assert.deepEqual(firstBytes,repeatBytes,'Normalized builds differ: '+file);const report=requireCleanArtifact(firstBytes,{wasm:file.endsWith('.wasm')});outputs[file]={bytes:firstBytes.length,sha256:sha(firstBytes),repeatSha256:sha(repeatBytes),pathAudit:report};}
const mappings=[{from:'workspace',to:'/src/playground'},{from:'target-directory',to:'/build/target'},{from:'Lindera-source-root',to:'/src/lindera'},{from:'Cargo-home',to:'/cargo'},{from:'Rust-sysroot',to:'/rust/toolchain'},{from:'each-Cargo-registry-source-root',to:'/cargo/registry'}];
const commandEvidence=[];
for(const suffix of ['','-repeat']){const log=await fs.readFile(path.join(output,`compiler-commands-normalized${suffix}.log`));const line=log.toString().split('\n').find(x=>x.includes('--crate-name lindera_wasm'));assert.ok(line,'Actual rustc command absent');for(const mapping of mappings)assert.ok(line.includes('='+mapping.to),'Actual rustc remap absent: '+mapping.to);commandEvidence.push({sha256:sha(log),linderaRustcCommandFound:true,virtualMappingsVerified:true});}
const standard=await json(path.join(output,'standard-library-artifacts.json'));
for(const suffix of ['','-repeat'])await preserveEvidence(await fs.readFile(path.join(output,`compiler-commands-normalized${suffix}.log`)),'.log');
assert.deepEqual([...standard].sort((a,b)=>a.file.localeCompare(b.file)),[...measured.standardLibraryArtifacts.files].sort((a,b)=>a.file.localeCompare(b.file)),'Prebuilt standard library changed');
const sourceComparison=await json(path.join(output,'source-comparison.json'));assert.equal(sourceComparison.filesChecked,704);assert.equal(sourceComparison.allMatched,true);
const provenance={schemaVersion:2,artifactKind:'self-built',recordedBuildDate:'2026-10-13',source:{commit:measured.sourceCommit,url:`https://github.com/lindera/lindera/archive/${measured.sourceCommit}.zip`,archiveUrl:'https://github.com/lindera/lindera/archive/refs/tags/v6.2.0.zip',archiveSha256:measured.sourceArchiveSha256,filesChecked:704,cargoLockSha256:measured.cargoLockSha256},toolchain:measured.toolchain,
 build:{...measured.build,rawCargoWasmSha256:sha(await fs.readFile(path.join(output,'target-normalized/wasm32-unknown-unknown/release/lindera_wasm.wasm'))),pathRemapping:{transport:'CARGO_ENCODED_RUSTFLAGS',scope:'all (compiler default)',nativeAndForwardSlashPrefixes:true,mappings}},
 cargoCommand:['cargo','+1.98.1','build','-p','lindera-wasm','--target','wasm32-unknown-unknown','--release','--no-default-features','--locked','--offline','--message-format=json-render-diagnostics','-vv'],bindgenCommand:['wasm-bindgen','lindera_wasm.wasm','--target','web','--out-name','lindera_wasm'],dependencies,standardLibraryArtifacts:measured.standardLibraryArtifacts,outputs,compilerEvidence:{compilerArtifactHashes:[first.logSha256,repeat.logSha256],commandEvidence},repeatBuild:{sameMachine:true,separateCargoHome:true,separateSourceDirectory:true,separateTargetDirectory:true,byteIdentical:true},completeness:{binarySbom:false,limitations:['Compiled packages are not proof of every linked component.','Prebuilt Rust standard library retains upstream canonical /rustc and /rust/deps source locations.','Independent OS/CI runner reproduction remains unverified.']}};
const bytes=Buffer.from(JSON.stringify(provenance,null,2)+'\n');
await fs.writeFile(path.join(output,'normalized-provenance.json'),bytes);
const before=inspectArtifact(await fs.readFile(path.join(vendor,'lindera_wasm_bg.wasm')));
await fs.writeFile(path.join(root,'experiments/furigana-self-build/NORMALIZED-BUILD.json'),JSON.stringify({date:'2026-10-13',provenanceSha256:sha(bytes),dependencyCount:106,compiledDependenciesAndFeaturesUnchanged:true,sourceAndLockUnchanged:true,standardLibraryUnchanged:true,repeatBuild:provenance.repeatBuild,mappings,outputs,before:{violations:before.violations,sourcePathCount:before.sourcePathCount,virtualPathCount:before.virtualPathCount,canonicalRustPathCount:before.canonicalRustPathCount,canonicalRustDepPathCount:before.canonicalRustDepPathCount,sectionPaths:before.sectionPaths}},null,2)+'\n');
console.log(JSON.stringify({provenanceSha256:sha(bytes),outputs:Object.fromEntries(Object.entries(outputs).map(([k,v])=>[k,{sha256:v.sha256,bytes:v.bytes,localPaths:v.pathAudit.violations.length}]))},null,2));
