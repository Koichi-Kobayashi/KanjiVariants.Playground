// Audit-only: copies official notices, records source dependency candidates and verifies deployed bytes.
// Does not build/replace the engine or dictionary and never grants publication approval.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidence = path.resolve(root, process.argv[2] ?? 'artifacts/license-audit');
const target = path.join(root, 'src/KanjiVariants.Playground/wwwroot/furigana/lindera-6.2.0');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const read = name => fs.readFile(path.join(evidence, name));
const currentManifest=JSON.parse(await fs.readFile(path.join(target,'manifest.json')));
if(currentManifest.buildOrigin==='self-built')throw new Error('Historical official-npm collector cannot overwrite adopted self-build evidence. Retain notices and use the self-build verification workflow.');
for (const [file, expected] of [
    ['lindera-wasm-6.2.0.tgz','ed82e271e54a4bddaeeeddcbe8f69037c5d7dbbd6f273bd516cdb7325c866cdf'],
    ['lindera-ipadic-6.2.0.zip','5ed4bba6b429030b0387df67d40d5751d35dedef0306f4bac6d957cad5f04b72'],
    ['mecab-ipadic-2.7.0-20250920.tar.gz','a7ba9f645ffe7094e56ae1c4a81d100df8fbb1e28bbe1792622e9728e162db3d'],
    ['mecab-ipadic-2.7.0-20070801.tar.gz','099e46e80d55e7c0d6906783aff713748e1ae90f46c5ef96ec153bbf09bf5550'],
    ['rustc-1.98.1-x86_64-unknown-linux-gnu.tar.xz','e974f036b28565f37c0f3bd92ddefa809bee16c04f9dcf07b9ed96e05aaaf7c4']
]) if (sha(await read(file)) !== expected) throw new Error('Unverified evidence archive: '+file);
const metadata = JSON.parse(await read('wasm-metadata-limited.json'));
const scope = JSON.parse(await read('wasm-source-scope.json'));
const correspondence = JSON.parse(await read('kanaria-correspondence.json'));
const kanariaLicense = await read('kanaria-LICENSE.txt');
if (sha(kanariaLicense) !== 'f44d765862a602a68553b3614e63b0ea4646d7698d2c34fc8d60f7998c9a8e7b' || correspondence.licenseSha256 !== sha(kanariaLicense) || correspondence.commit !== 'c994ccf06d179851a1c7c3285c3a408ccb6279ec') throw new Error('Unverified kanaria correspondence');
const lock = (await read('Cargo.lock')).toString();
const tree = (await read('wasm-build-limited.txt')).toString();
const ids = new Set([...tree.matchAll(/^([\w-]+) v([\w.+-]+)/gm)].map(m => `${m[1]}@${m[2]}`));
const manifest = JSON.parse(await fs.readFile(path.join(target, 'manifest.json')));
for (const asset of [manifest.javascript, manifest.wasm, ...manifest.dictionary]) {
    const bytes = await fs.readFile(path.join(target, asset.file));
    if (sha(bytes) !== asset.sha256) throw new Error('Deployed asset changed: ' + asset.file);
    if (asset.gzip && sha(gunzipSync(bytes)) !== asset.rawSha256) throw new Error('Dictionary content changed');
    const official = asset.gzip ? await read('binary-dictionary/lindera-ipadic/'+asset.file.slice(0,-3)) : await read('npm/package/'+asset.file);
    if (!(asset.gzip ? gunzipSync(bytes) : bytes).equals(official)) throw new Error('Official artifact mismatch: '+asset.file);
}
let notices = 'Lindera 6.2.0: source dependency candidate notices\n\n';
notices += 'Scope: v6.2.0 Cargo.lock / wasm32-unknown-unknown / root lindera-wasm with no default or extra root features.\n';
notices += 'Includes normal target candidates, host proc-macro subtrees and build-only candidates, with separate roles in LICENSE-INVENTORY.json.\n';
notices += 'This is NOT an attested SBOM of the npm WASM binary. Actual release build resolution is unconfirmed.\n';
notices += 'Full upstream license files are preserved below. OR alternatives remain alternatives; AND conditions remain cumulative.\n\n';
const inventory = [];
for (const pkg of metadata.packages.filter(p => ids.has(`${p.name}@${p.version}`)).sort((a,b) => `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`))) {
    const directory = path.dirname(pkg.manifest_path);
    let files = (await fs.readdir(directory)).filter(f => /^(LICENSE|LICENCE|COPYING|NOTICE|COPYRIGHT|UNLICENSE)([._-]|$)/i.test(f));
    let locations = files.map(file => ({ file, location: path.join(directory, file) }));
    if (pkg.name === 'kanaria' && pkg.version === '0.2.0') locations = [{ file:'upstream/LICENSE.txt', location:path.join(evidence,'kanaria-LICENSE.txt') }];
    if (!pkg.source && files.length === 0) locations = [{ file: 'workspace/LICENSE', location: path.join(evidence,'source/lindera-6.2.0/LICENSE') }];
    const lockBlock = lock.split('[[package]]').find(b => b.includes(`name = "${pkg.name}"\n`) && b.includes(`version = "${pkg.version}"\n`));
    const checksum = lockBlock?.match(/checksum = "([a-f0-9]+)"/)?.[1] ?? null;
    if (pkg.source) {
        const archive = path.join(path.resolve(directory,'../../..'), 'cache', path.basename(path.dirname(directory)), `${pkg.name}-${pkg.version}.crate`);
        if (!checksum || sha(await fs.readFile(archive)) !== checksum) throw new Error('Registry checksum mismatch: '+pkg.name);
    }
    const resolvedScope = scope.packages.find(p=>p.name===pkg.name&&p.version===pkg.version);
    if (!resolvedScope) throw new Error('Package missing from limited scope');
    const item = { name: pkg.name, version: pkg.version, declaredLicense: pkg.license, repository: pkg.repository,
        role:resolvedScope.role, features:resolvedScope.features,featureVariants:resolvedScope.featureVariants,
        source: pkg.source ? `https://static.crates.io/crates/${pkg.name}/${pkg.name}-${pkg.version}.crate` : 'https://github.com/lindera/lindera/tree/0482efcc46b5ec518b7238efae55e9fed9bba0c0',
        archiveSha256: checksum, noticeFiles: [], status: locations.length ? 'source notices collected; binary inclusion unconfirmed' : 'BLOCKED: license text/copyright unavailable' };
    if (pkg.name === 'kanaria') {item.correctedRepository='https://github.com/samunohito/kanaria';item.licenseCorrespondence=correspondence;}
    notices += `\n${'='.repeat(78)}\n${pkg.name} ${pkg.version}\nDeclared license: ${pkg.license}\nSource: ${item.source}\n`;
    if (!locations.length) notices += 'UNRESOLVED: published crate has no license/copyright file. No substitute license is invented.\n';
    for (const { file, location } of locations) {
        const stat = await fs.stat(location); if (!stat.isFile()) continue;
        const bytes = await fs.readFile(location);
        notices += `\n--- ${file} (SHA-256 ${sha(bytes)}) ---\n${bytes.toString()}\n`;
        item.noticeFiles.push({ file, sha256: sha(bytes) });
    }
    inventory.push(item);
}
notices += '\n'+'='.repeat(78)+'\nlibyaml upstream of unsafe-libyaml 0.2.11\n';
notices += 'Source explicitly linked by the published unsafe-libyaml README:\nhttps://github.com/yaml/libyaml/blob/2c891fc7a770e8ba2fec34fc6b545c672beb37e6/License\n\n';
notices += (await read('libyaml-License')).toString()+'\n';
for (const [source, output] of [
    ['ipadic-source/mecab-ipadic-2.7.0-20250920/COPYING','IPADIC-COPYING'],
    ['source/lindera-6.2.0/LICENSE','LINDERA-CORE-LICENSE'],
    ['rust-LICENSE-MIT','RUST-1.98.1-LICENSE-MIT'],
    ['rust-LICENSE-APACHE','RUST-1.98.1-LICENSE-APACHE'],
    ['rust-COPYRIGHT','RUST-1.98.1-COPYRIGHT'],
    ['libyaml-License','LIBYAML-LICENSE'],
    ['kanaria-LICENSE.txt','KANARIA-LICENSE.txt'],
    ['kanaria-correspondence.json','KANARIA-PROVENANCE.json'],
    ['wasm-source-scope.json','WASM-SOURCE-DEPENDENCIES.json']
]) await fs.copyFile(path.join(evidence, source), path.join(target, output));
await fs.cp(path.join(evidence,'rust-notices/rustc-1.98.1-x86_64-unknown-linux-gnu/rustc/share/doc/rust'), path.join(target,'rust-1.98.1'), { recursive:true });
await fs.writeFile(path.join(target, 'THIRD-PARTY-NOTICES.txt'), notices);
await fs.writeFile(path.join(target, 'LICENSE-INVENTORY.json'), JSON.stringify({
    scope: 'Source dependency candidates; NOT a binary-attested SBOM', sourceCommit:'0482efcc46b5ec518b7238efae55e9fed9bba0c0',
    cargoLockSha256:sha(await read('Cargo.lock')), target:'wasm32-unknown-unknown', rootFeatures:[],rootDefaultFeatures:false,
    sourceScope:'WASM-SOURCE-DEPENDENCIES.json',engineSha256:manifest.wasm.sha256, packages:inventory
}, null, 2)+'\n');
manifest.publicationApproved = false;
manifest.publicationBlockers = [
    '公式npm WASMと限定した固定ソース依存範囲の完全対応が未証明。確認した範囲の通知不足は解消したが、実ビルドの追加・相違依存に対する通知網羅性が未確定（公開前監査基準による停止）'
];
const noticeFiles = [];
async function collectNotices(directory) {
    for (const entry of await fs.readdir(directory,{withFileTypes:true})) {
        const full = path.join(directory,entry.name);
        if (entry.isDirectory()) await collectNotices(full);
        else if (!entry.name.endsWith('.gz') && !entry.name.endsWith('.wasm') && !entry.name.endsWith('.js') && entry.name !== 'manifest.json')
            noticeFiles.push({file:path.relative(target,full).replaceAll('\\','/'),sha256:sha(await fs.readFile(full))});
    }
}
await collectNotices(target);
manifest.licenseAudit = {date:'2026-10-12', status:'blocked', ipadicDateLabel:'resolved; original NOTICE retained with full COPYING and provenance',
    sourceCommit:'0482efcc46b5ec518b7238efae55e9fed9bba0c0', rustcProducer:'1.98.1 (48a229cea 2026-09-01)',
    candidateInventory:'LICENSE-INVENTORY.json', sourceScope:'WASM-SOURCE-DEPENDENCIES.json',binaryAttested:false,
    noticeFulfillment:{status:'satisfied-for-fixed-source-scope',unresolved:inventory.filter(p=>p.status.startsWith('BLOCKED')).map(p=>`${p.name}@${p.version}`),
        kanaria:'resolved by byte-identical crate source and original manifest at license-bearing upstream commit',
        limitation:'Does not prove notice completeness for unidentified additional dependencies in the official binary'},
    sbomCompleteness:{status:'unproven',binaryAttested:false,reason:'Official build dependency resolution/features/lock use unconfirmed; source graph is not a binary SBOM'},
    noticeFiles:noticeFiles.sort((a,b)=>a.file.localeCompare(b.file))};
await fs.writeFile(path.join(target,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Collected source notices for ${inventory.length} candidates; ${inventory.filter(x=>x.status.startsWith('BLOCKED')).length} missing. Publication approval unchanged.`);
