// Privacy-preserving projection of the preserved Cargo JSON messages.
// This transformation is reproducible only when the original log is available.
import path from 'node:path';
import assert from 'node:assert/strict';
export function projectCompilerLog(bytes) {
 const rows=bytes.toString('utf8').split(/\r?\n/).filter(x=>x.startsWith('{')).map(x=>JSON.parse(x));
 assert.equal(rows.at(-1)?.reason,'build-finished'); assert.equal(rows.at(-1)?.success,true);
 return rows.filter(x=>x.reason==='compiler-artifact').map(x=>{
  assert.equal(x.fresh,false,'Original build must not be a later cached run');
  const [source,fragment]=x.package_id.split('#');
  const identity=fragment.includes('@')?fragment:decodeURIComponent(source.split('/').at(-1))+'@'+fragment;
  return {package:identity,source:source.startsWith('registry+')?source:'fixed-lindera-workspace',
   features:x.features,targetKinds:x.target.kind,platform:x.filenames.some(f=>f.includes('wasm32-unknown-unknown'))?'wasm32-unknown-unknown':'host',
   targetName:x.target.name,crateTypes:x.target.crate_types,profile:x.profile,
   artifacts:x.filenames.map(f=>path.win32.basename(f)),fresh:false};
 });
}
export function variantsFor(rows,identity) {
 const variants=new Map();
 for(const row of rows.filter(r=>r.package===identity)) {
  const variant={features:row.features,targetKinds:row.targetKinds,platform:row.platform};
  variants.set(JSON.stringify(variant),variant);
 }
 return [...variants.values()];
}
