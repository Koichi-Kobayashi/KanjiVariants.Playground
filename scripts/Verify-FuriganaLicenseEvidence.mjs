import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'src/KanjiVariants.Playground/wwwroot/furigana/lindera-6.2.0');
const manifest = JSON.parse(await fs.readFile(path.join(target,'manifest.json')));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
for (const asset of [manifest.javascript, manifest.wasm, ...manifest.dictionary]) {
    const bytes = await fs.readFile(path.join(target,asset.file));
    if (sha(bytes) !== asset.sha256) throw new Error('Asset hash mismatch: '+asset.file);
    if (asset.gzip && sha(gunzipSync(bytes)) !== asset.rawSha256) throw new Error('Dictionary hash mismatch: '+asset.file);
}
if (!manifest.licenseAudit?.noticeFiles?.length) throw new Error('License audit evidence is missing');
for (const file of manifest.licenseAudit.noticeFiles) {
    const resolved = path.resolve(target,file.file);
    if (!resolved.startsWith(target+path.sep)) throw new Error('Invalid notice path');
    if (sha(await fs.readFile(resolved)) !== file.sha256) throw new Error('Notice hash mismatch: '+file.file);
}
const inventory = JSON.parse(await fs.readFile(path.join(target,'LICENSE-INVENTORY.json')));
if (inventory.engineSha256 !== manifest.wasm.sha256) throw new Error('Inventory engine mismatch');
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
// Integrity verification is separate from granting redistribution approval.
