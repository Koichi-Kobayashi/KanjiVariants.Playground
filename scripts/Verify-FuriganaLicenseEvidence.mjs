import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import {pins} from './FuriganaSelfBuildPolicy.mjs';
import {requireCleanArtifact} from './Verify-FuriganaPaths.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = process.argv[2] ? path.resolve(root,process.argv[2],'furigana/lindera-6.2.0') : path.join(root, 'src/KanjiVariants.Playground/wwwroot/furigana/lindera-6.2.0');
const manifest = JSON.parse(await fs.readFile(path.join(target,'manifest.json')));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(manifest.buildOrigin,'self-built','Only the adopted self-build may be distributed');
assert.equal(manifest.wasm.sha256,pins.wasm,'Official or unreviewed WASM is forbidden');
assert.equal(manifest.javascript.sha256,pins.javascript);
assert.equal(manifest.buildProvenance.file,'SELF-BUILD-PROVENANCE.json');
assert.equal(manifest.buildProvenance.sha256,pins.provenance);
const provenanceBytes=await fs.readFile(path.join(target,'SELF-BUILD-PROVENANCE.json'));
assert.equal(sha(provenanceBytes),pins.provenance);
const provenance=JSON.parse(provenanceBytes);
assert.equal(provenance.source.commit,pins.sourceCommit);
assert.equal(provenance.source.archiveSha256,pins.sourceArchive);
assert.equal(provenance.source.cargoLockSha256,pins.lock);
assert.equal(sha(await fs.readFile(path.join(target,'SELF-BUILD-CARGO.lock'))),pins.lock);
assert.equal(provenance.toolchain.rust,'1.98.1');
assert.equal(provenance.toolchain.cargo,'1.98.1');
assert.equal(provenance.toolchain.wasmBindgen,'0.2.126');
assert.equal(provenance.build.target,'wasm32-unknown-unknown');
assert.deepEqual(provenance.build.rootFeatures,[]);
assert.equal(provenance.build.rootDefaultFeatures,false);
assert.equal(provenance.build.locked,true);assert.equal(provenance.build.offline,true);
assert.equal(provenance.build.wasmOpt,false);assert.equal(provenance.build.bindgenTarget,'web');
assert.equal(provenance.outputs['lindera_wasm_bg.wasm'].sha256,pins.wasm);
assert.equal(provenance.outputs['lindera_wasm.js'].sha256,pins.javascript);
assert.equal(provenance.completeness.binarySbom,false);
assert.equal(provenance.schemaVersion,2);
assert.equal(provenance.build.pathRemapping.transport,'CARGO_ENCODED_RUSTFLAGS');
assert.equal(provenance.repeatBuild.separateCargoHome,true);
assert.equal(provenance.repeatBuild.separateSourceDirectory,true);
assert.equal(provenance.repeatBuild.byteIdentical,true);
for (const asset of [manifest.javascript, manifest.wasm, ...manifest.dictionary]) {
    const bytes = await fs.readFile(path.join(target,asset.file));
    assert.equal(bytes.length,asset.bytes,'Asset byte length: '+asset.file);
    if (sha(bytes) !== asset.sha256) throw new Error('Asset hash mismatch: '+asset.file);
    if(asset===manifest.wasm||asset===manifest.javascript)requireCleanArtifact(bytes,{wasm:asset===manifest.wasm});
    if (asset.gzip) { const raw=gunzipSync(bytes);assert.equal(raw.length,asset.rawBytes);if(sha(raw)!==asset.rawSha256)throw new Error('Dictionary hash mismatch: '+asset.file); }
}
if (!manifest.licenseAudit?.noticeFiles?.length) throw new Error('License audit evidence is missing');
for (const file of manifest.licenseAudit.noticeFiles) {
    const resolved = path.resolve(target,file.file);
    if (!resolved.startsWith(target+path.sep)) throw new Error('Invalid notice path');
    if (sha(await fs.readFile(resolved)) !== file.sha256) throw new Error('Notice hash mismatch: '+file.file);
}
const inventory = JSON.parse(await fs.readFile(path.join(target,'LICENSE-INVENTORY.json')));
if (inventory.engineSha256 !== manifest.wasm.sha256) throw new Error('Inventory engine mismatch');
assert.equal(provenance.dependencies.length,106);
for(const p of provenance.dependencies) {
 const notice=inventory.packages.find(x=>x.name===p.name&&x.version===p.version);
 assert.ok(notice?.noticeFiles?.length,'Compiled dependency notice missing: '+p.name);
 assert.equal(notice.archiveSha256??null,p.archiveSha256);
 assert.equal(notice.role,p.role);
 assert.deepEqual(notice.noticeFiles,p.noticeFiles);
 assert.ok(p.compiledVariants.length);
}
assert.ok(provenance.standardLibraryArtifacts.files.length>0);
const bindgenNotices=inventory.packages.find(p=>p.name==='wasm-bindgen'&&p.version==='0.2.126').noticeFiles;
for(const expected of ['378f5840b258e2779c39418f3f2d7b2ba96f1c7917dd6be0713f88305dbda397','a60eea817514531668d7e00765731449fe14d059d3249e0bc93b36de45f759f2'])assert.ok(bindgenNotices.some(n=>n.sha256===expected),'Generator/runtime notice coverage');
const scope = JSON.parse(await fs.readFile(path.join(target,'WASM-SOURCE-DEPENDENCIES.json')));
if (scope.target !== 'wasm32-unknown-unknown' || scope.rootPackage !== 'lindera-wasm@6.2.0' || scope.rootFeatures.length || scope.rootDefaultFeatures !== false || scope.cargoLockSha256 !== inventory.cargoLockSha256) throw new Error('Limited source scope mismatch');
if (scope.packages.length !== inventory.packages.length || scope.packages.some(p=>!inventory.packages.some(x=>x.name===p.name&&x.version===p.version&&x.role===p.role))) throw new Error('Inventory/source roles mismatch');
const kanaria = inventory.packages.find(p=>p.name==='kanaria'&&p.version==='0.2.0');
const correspondence = JSON.parse(await fs.readFile(path.join(target,'KANARIA-PROVENANCE.json')));
if (correspondence.commit !== 'c994ccf06d179851a1c7c3285c3a408ccb6279ec' || correspondence.sourceFiles.length !== 13 || correspondence.licenseSha256 !== 'f44d765862a602a68553b3614e63b0ea4646d7698d2c34fc8d60f7998c9a8e7b' || kanaria?.licenseCorrespondence?.licenseSha256 !== correspondence.licenseSha256 || sha(await fs.readFile(path.join(target,'KANARIA-LICENSE.txt'))) !== correspondence.licenseSha256) throw new Error('kanaria license correspondence mismatch');
const missing=inventory.packages.filter(p=>p.status.startsWith('BLOCKED'));
if (manifest.licenseAudit.noticeFulfillment.unresolved.length !== missing.length) throw new Error('Notice fulfillment does not match inventory');
console.log(`Furigana license evidence hashes verified: ${manifest.licenseAudit.noticeFiles.length} notices; ${inventory.packages.length} source candidates (not binary-attested).`);
console.log(`Limited scope: ${scope.normalTargetCandidates} normal target / ${scope.hostProcMacroSubtreeCandidates} proc-macro host subtree / ${scope.buildOnlyCandidates} build-only. Unfulfilled known notices: ${missing.length}.`);
console.log('Adopted self-build provenance, pinned WASM/JS and Cargo.lock verified; 106 compiled packages covered. Full binary SBOM remains unproven.');
// Integrity verification is separate from granting redistribution approval.
