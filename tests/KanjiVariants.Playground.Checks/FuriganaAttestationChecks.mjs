import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {verifyAttestation,requirePublication,sha} from '../../scripts/Verify-FuriganaAttestation.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'furigana-attestation-checks-'));
const vendor=path.join(temp,'vendor');
const inputs=path.join(root,'artifacts/furigana-attestation-inputs');
const policy=path.join(temp,'policy.json');
let passed=0;
async function reject(name,action,options={}) {
 const restores=[];
 const edit=async(file,transform)=>{const full=path.join(vendor,file),old=await fs.readFile(full);restores.push(()=>fs.writeFile(full,old));const value=await transform(Buffer.from(old));if(value===null)await fs.unlink(full);else await fs.writeFile(full,value);};
 try {await action(edit);await assert.rejects(()=>verifyAttestation({vendor,inputs,policy,...options}),undefined,name);passed++;}
 finally {for(const restore of restores.reverse())await restore();}
}
const changeRecord=transform=>async edit=>edit('attestation-v1/ATTESTATION.json',b=>{const j=JSON.parse(b);transform(j);return JSON.stringify(j);});
try {
 await fs.cp(path.join(root,'src/KanjiVariants.Playground/wwwroot/furigana/lindera-6.2.0'),vendor,{recursive:true});
 const policyBytes=await fs.readFile(path.join(root,'scripts/furigana-attestation-policy.json'));await fs.writeFile(policy,policyBytes);
 const result=await verifyAttestation({vendor,inputs,policy});assert.equal(result.dependencies,106);assert.equal(result.rawEvidenceRechecked,false);passed++;
 for(const file of ['lindera_wasm_bg.wasm','lindera_wasm.js','dict.words.gz'])await reject(file+' tamper',async edit=>edit(file,b=>{b[12]^=1;return b;}));
 for(const [name,mutate] of [
  ['missing dependency',a=>a.dependencies.pop()],['feature mismatch',a=>a.dependencies[0].compiledVariants[0].features.push('unreviewed')],
  ['target mismatch',a=>a.build.target='x86_64-unknown-linux-gnu'],['original hash mismatch',a=>a.compilerLogs[0].originalSha256='0'.repeat(64)],
  ['standard input mismatch',a=>a.standardLibrary.inputs[0].sha256='0'.repeat(64)],['unknown schema',a=>a.schemaVersion=99],
  ['unsupported profile',a=>a.profile='complete-sbom'],['false full proof',a=>{a.exclusions=[];a.claims.push('complete-final-linked-sbom');}],
  ['notice inventory omitted',a=>a.notices.pop()]])await reject(name,changeRecord(mutate));
 for(const file of ['attestation-v1/ATTESTATION.json','attestation-v1/COMPILER-BUILD-1.json','KANARIA-LICENSE.txt','attestation-v1/supplement/addr2line/LICENSE-MIT','attestation-v1/RUST-STANDARD-LIBRARY-REVIEW.json'])await reject(file+' missing',async edit=>edit(file,()=>null));
 await reject('compiled record modified',async edit=>edit('attestation-v1/COMPILER-BUILD-1.json',b=>{const j=JSON.parse(b);j[0].platform='host';return JSON.stringify(j);}));
 await reject('manifest false full attestation',async edit=>edit('manifest.json',b=>{const j=JSON.parse(b);j.licenseAudit.binaryAttested=true;return JSON.stringify(j);}));
 // Simultaneous record/manifest/policy changes cannot replace the code-reviewed trust roots.
 try {
  const changed=JSON.parse(policyBytes);changed.profile='unreviewed';await fs.writeFile(policy,JSON.stringify(changed));
  await reject('record + policy altered together',changeRecord(a=>a.profile='unreviewed'));
 } finally {await fs.writeFile(policy,policyBytes);}
 await reject('asset + record + manifest altered together',async edit=>{
  let digest;await edit('lindera_wasm_bg.wasm',b=>{b[12]^=1;digest=sha(b);return b;});
  await edit('manifest.json',b=>{const j=JSON.parse(b);j.wasm.sha256=digest;return JSON.stringify(j);});
  await edit('attestation-v1/ATTESTATION.json',b=>{const j=JSON.parse(b);j.subjects.wasm.sha256=digest;return JSON.stringify(j);});
 });
 const missingInputs=path.join(temp,'inputs');await fs.mkdir(missingInputs);
 await reject('missing official component',async()=>{}, {inputs:missingInputs});
 await fs.writeFile(path.join(missingInputs,'rust-std-1.98.1-wasm32-unknown-unknown.tar.xz'),'tampered');
 await reject('tampered official component',async()=>{}, {inputs:missingInputs});
 // Private raw mode must reject a wrong saved log, not silently fall back to CI mode.
 const raw=path.join(temp,'raw');await fs.mkdir(raw);
 const a=JSON.parse(await fs.readFile(path.join(vendor,'attestation-v1/ATTESTATION.json')));
 await fs.writeFile(path.join(raw,a.compilerLogs[0].originalSha256+'.jsonl'),'cached-or-corrupt-log');
 await reject('corrupt preserved original',async()=>{}, {rawEvidence:raw});
 const m=JSON.parse(await fs.readFile(path.join(vendor,'manifest.json')));
 // Approval-state fixtures remain negative even after the owner approves production.
 assert.throws(()=>requirePublication({...m,publicationApproved:false,publicationBlockers:[]}),/publicationApproved=false/);passed++;
 assert.throws(()=>requirePublication({...m,publicationApproved:true,publicationBlockers:['unresolved test blocker']}),/Unresolved publication blockers/);passed++;
 // The pure approval predicate requires both conditions; it never bypasses technical verification in the CLI/gate.
 requirePublication({...m,publicationApproved:true,publicationBlockers:[]});passed++;
 const published=path.join(temp,'publish');await fs.mkdir(path.join(published,'furigana'),{recursive:true});
 await fs.cp(vendor,path.join(published,'furigana/lindera-6.2.0'),{recursive:true});
 await verifyAttestation({vendor,inputs,policy,publishRoot:published});passed++;
 await fs.unlink(path.join(published,'furigana/lindera-6.2.0/attestation-v1/ATTESTATION.json'));
 await reject('missing published attestation',async()=>{}, {publishRoot:published});
 console.log(`Scoped attestation checks passed: ${passed} positive/negative/approval cases. Private raw evidence is tested locally; CI does not claim access to it.`);
} finally {
 assert.equal(path.dirname(temp),path.resolve(os.tmpdir()));assert(path.basename(temp).startsWith('furigana-attestation-checks-'));
 await fs.rm(temp,{recursive:true,force:true});
}
