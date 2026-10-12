// Audit only. Records limited source resolution and proves the kanaria 0.2.0 source/license correspondence.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.resolve(root,process.argv[2]??'artifacts/license-audit');
const read=name=>fs.readFile(path.join(dir,name));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const metadata=JSON.parse(await read('wasm-metadata-limited.json'));
const ids=async file=>new Set([...(await read(file)).toString().matchAll(/^([\w-]+) v([\w.+-]+)/gm)].map(m=>`${m[1]}@${m[2]}`));
const normal=await ids('wasm-normal-limited.txt'), all=await ids('wasm-build-limited.txt'), target=await ids('wasm-target-limited.txt');
function parseFeatures(bytes) {
    const result=new Map();
    for(const line of bytes.toString().split('\n')) {
        const m=line.match(/^([\w-]+) v([\w.+-]+).*\|(.*)$/); if(!m)continue;
        const id=`${m[1]}@${m[2]}`,value=m[3].replace(/ \(\*\)\r?$/,'').trim().split(',').filter(Boolean).sort();
        const variants=result.get(id)??[];
        if(!variants.some(x=>JSON.stringify(x)===JSON.stringify(value)))variants.push(value);
        result.set(id,variants);
    }
    return result;
}
const features=parseFeatures(await read('wasm-package-features.txt'));
const defaults=parseFeatures(await read('wasm-default-package-features.txt'));
const sameIds=defaults.size===features.size&&[...features.keys()].every(id=>defaults.has(id));
const sameNonRoot=[...features.entries()].filter(([id])=>id!=='lindera-wasm@6.2.0').every(([id,variants])=>JSON.stringify(variants)===JSON.stringify(defaults.get(id)));
if(!sameIds||!sameNonRoot)throw Error('Default-root comparison changed dependency scope');
const packages=metadata.packages.filter(p=>all.has(`${p.name}@${p.version}`)).map(p=>({
    name:p.name,version:p.version,declaredLicense:p.license,featureVariants:features.get(`${p.name}@${p.version}`)??[],
    features:[...new Set((features.get(`${p.name}@${p.version}`)??[]).flat())].sort(),
    role:target.has(`${p.name}@${p.version}`)?'normal target candidate':normal.has(`${p.name}@${p.version}`)?'host proc-macro subtree candidate':'build-only candidate',
    procMacro:p.targets.some(t=>t.kind.includes('proc-macro'))
})).sort((a,b)=>`${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`));
const wasm=packages.find(p=>p.name==='lindera-wasm');
if(wasm.features.length||packages.some(p=>/^lindera-(ipadic|unidic|ko-dic|cc-cedict|jieba|sudachidict)/.test(p.name)))throw Error('Unexpected dictionary feature in limited scope');
const lockSha=sha(await read('source/lindera-6.2.0/Cargo.lock'));
if(lockSha!=='6b30d175d6234ad39b8b969101af13834b28545f3eb9801e454002832db18d75')throw Error('Fixed Cargo.lock changed');
const scope={scope:'Fixed-source dependency resolution, NOT official npm binary build metadata',sourceCommit:'0482efcc46b5ec518b7238efae55e9fed9bba0c0',cargoLockSha256:lockSha,
    rootPackage:'lindera-wasm@6.2.0',target:'wasm32-unknown-unknown',rootDefaultFeatures:false,rootFeatures:[],
    transitiveDefaultFeatures:'preserved as declared upstream; root --no-default-features does not disable them',
    featuresMeaning:'Union of observed cargo tree feature variants; variants retain host/target resolution differences',
    defaultRootComparison:{rootDefaultsEnabled:true,rootFeatureVariants:defaults.get('lindera-wasm@6.2.0'),samePackageIds:sameIds,sameNonRootFeatures:sameNonRoot},
    excluded:'dev dependencies, optional embedded dictionaries; build-only and proc-macro host roles kept separate',
    normalCandidates:normal.size,normalTargetCandidates:target.size,hostProcMacroSubtreeCandidates:normal.size-target.size,buildOnlyCandidates:all.size-normal.size,
    evidenceFiles:[],packages};
for(const name of ['wasm-normal-limited.txt','wasm-build-limited.txt','wasm-target-limited.txt','wasm-package-features.txt','wasm-default-package-features.txt','wasm-features-limited.txt','wasm-metadata-limited.json'])
    scope.evidenceFiles.push({file:name,sha256:sha(await read(name))});
const kanaria=metadata.packages.find(p=>p.name==='kanaria'&&p.version==='0.2.0');
const crate=path.dirname(kanaria.manifest_path);
const vcs=JSON.parse(await fs.readFile(path.join(crate,'.cargo_vcs_info.json')));
const commit='c994ccf06d179851a1c7c3285c3a408ccb6279ec';
if(vcs.git.sha1!==commit)throw Error('Unexpected kanaria source commit');
const source=path.join(dir,`kanaria-source/kanaria-${commit}/kanaria_core`);
const records=[];
async function compareSources(directory) {
    for(const item of await fs.readdir(directory,{withFileTypes:true})) {
        const full=path.join(directory,item.name);
        if(item.isDirectory())await compareSources(full);
        else {const rel=path.relative(path.join(crate,'src'),full),bytes=await fs.readFile(full);
            if(!bytes.equals(await fs.readFile(path.join(source,'src',rel))))throw Error('kanaria source mismatch: '+rel);
            records.push({file:'src/'+rel.replaceAll('\\','/'),sha256:sha(bytes)});
        }
    }
}
await compareSources(path.join(crate,'src'));
const original=await fs.readFile(path.join(crate,'Cargo.toml.orig'));
if(!original.equals(await fs.readFile(path.join(source,'Cargo.toml'))))throw Error('kanaria original manifest mismatch');
const license=await read('kanaria-LICENSE.txt');
if(!license.equals(await read(`kanaria-source/kanaria-${commit}/LICENSE.txt`)))throw Error('kanaria license mismatch');
if(sha(license)!=='f44d765862a602a68553b3614e63b0ea4646d7698d2c34fc8d60f7998c9a8e7b')throw Error('kanaria license hash mismatch');
const correspondence={name:'kanaria',version:'0.2.0',commit,licenseSource:`https://github.com/samunohito/kanaria/blob/${commit}/LICENSE.txt`,
    licenseSha256:sha(license),copyright:'Copyright (c) 2019 samu no hito',vcsSha256:sha(await fs.readFile(path.join(crate,'.cargo_vcs_info.json'))),
    originalManifestSha256:sha(original),sourceFiles:records,status:'crate src and original manifest byte-identical to license-bearing upstream commit'};
await fs.writeFile(path.join(dir,'wasm-source-scope.json'),JSON.stringify(scope,null,2)+'\n');
await fs.writeFile(path.join(dir,'kanaria-correspondence.json'),JSON.stringify(correspondence,null,2)+'\n');
console.log({normal:normal.size,target:target.size,host:normal.size-target.size,buildOnly:all.size-normal.size,kanariaSourceFiles:records.length});
