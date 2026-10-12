// Explicit adoption only; no download, official fallback or publication approval.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {pins} from './FuriganaSelfBuildPolicy.mjs';
import {requireCleanArtifact} from './Verify-FuriganaPaths.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const vendor=path.join(root,'src/KanjiVariants.Playground/wwwroot/furigana/lindera-6.2.0');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const provenance=JSON.parse(await fs.readFile(path.join(root,'artifacts/furigana-self-build/normalized-provenance.json')));
assert.equal(provenance.schemaVersion,2);
assert.equal(provenance.source.commit,pins.sourceCommit);
assert.equal(provenance.source.cargoLockSha256,pins.lock);
assert.equal(provenance.source.archiveSha256,pins.sourceArchive);
assert.equal(provenance.dependencies.length,106);
assert.equal(provenance.repeatBuild.separateCargoHome,true);
assert.equal(provenance.repeatBuild.separateSourceDirectory,true);
assert.equal(provenance.repeatBuild.byteIdentical,true);
assert.equal(provenance.toolchain.rust,'1.98.1');
assert.equal(provenance.toolchain.wasmBindgen,'0.2.126');
for(const [file,expected] of [['lindera_wasm_bg.wasm',pins.wasm],['lindera_wasm.js',pins.javascript]]) {
 const bytes=await fs.readFile(path.join(root,'artifacts/furigana-self-build/pkg-normalized',file));
 requireCleanArtifact(bytes,{wasm:file.endsWith('.wasm')});
 assert.equal(sha(bytes),expected);
 assert.equal(provenance.outputs[file].repeatSha256,expected);
}
const lock=await fs.readFile(path.join(root,'artifacts/license-audit/source/lindera-6.2.0/Cargo.lock'));
assert.equal(sha(lock),pins.lock);
const provenanceBytes=Buffer.from(JSON.stringify(provenance,null,2)+'\n');
assert.equal(sha(provenanceBytes),pins.provenance,'Reviewed provenance changed');
const manifest=JSON.parse(await fs.readFile(path.join(vendor,'manifest.json')));
for(const notice of manifest.licenseAudit.noticeFiles)assert.equal(sha(await fs.readFile(path.join(vendor,notice.file))),notice.sha256,'Existing notice changed before adoption: '+notice.file);
const inventory=JSON.parse(await fs.readFile(path.join(vendor,'LICENSE-INVENTORY.json')));
inventory.scope='Compiled self-build packages and fixed-source notices; NOT a complete binary-attested SBOM';
inventory.engineSha256=pins.wasm;
inventory.buildProvenance='SELF-BUILD-PROVENANCE.json';
await fs.writeFile(path.join(vendor,'LICENSE-INVENTORY.json'),JSON.stringify(inventory,null,2)+'\n');
await fs.writeFile(path.join(vendor,'SELF-BUILD-PROVENANCE.json'),provenanceBytes);
await fs.writeFile(path.join(vendor,'SELF-BUILD-CARGO.lock'),lock);
manifest.buildOrigin='self-built';
manifest.buildProvenance={file:'SELF-BUILD-PROVENANCE.json',sha256:sha(provenanceBytes)};
manifest.publicationApproved=false;
manifest.publicationBlockers=['公開承認は保留。標準ライブラリ内部・最終リンク成分の完全SBOM、別環境の再現性、モバイル実機等の未検証事項は監査記録を参照'];
manifest.licenseAudit.binaryAttested=false;
manifest.licenseAudit.noticeFulfillment.limitation='106 compiled packages and recorded Rust notices covered; not proof of every final linked component.';
manifest.licenseAudit.sbomCompleteness={status:'unproven',binaryAttested:false,reason:'Self-build compilation and toolchain inputs recorded; standard-library internals and final linked contents are not a complete SBOM.'};
manifest.licenseAudit.buildProvenance={status:'recorded-self-build',file:'SELF-BUILD-PROVENANCE.json'};
for(const file of ['SELF-BUILD-PROVENANCE.json','SELF-BUILD-CARGO.lock'])if(!manifest.licenseAudit.noticeFiles.some(x=>x.file===file))manifest.licenseAudit.noticeFiles.push({file});
for(const notice of manifest.licenseAudit.noticeFiles)notice.sha256=sha(await fs.readFile(path.join(vendor,notice.file)));
for(const [file,key] of [['lindera_wasm.js','javascript'],['lindera_wasm_bg.wasm','wasm']]) {
 const bytes=await fs.readFile(path.join(root,'artifacts/furigana-self-build/pkg-normalized',file));
 await fs.writeFile(path.join(vendor,file),bytes);
 manifest[key]={file,bytes:bytes.length,sha256:sha(bytes)};
}
await fs.writeFile(path.join(vendor,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Adopted pinned self-build; existing dictionary/notices preserved; publicationApproved=false. Provenance SHA-256: '+sha(provenanceBytes));
