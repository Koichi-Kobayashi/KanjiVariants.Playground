import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const rustCommit='48a229ceaefd4985c50990b14116b6d856af0985';
const virtualPrefixes=['/src/lindera/','/src/playground/','/cargo/registry/','/rust/toolchain/','/build/target/'];
const canonicalRustPrefix=`/rustc/${rustCommit}/library/`;
// Canonical paths already embedded in the pinned prebuilt Rust target libraries.
const canonicalRustDeps=['rustc-demangle-0.1.27','hashbrown-0.17.1','dlmalloc-0.2.13'].map(p=>`/rust/deps/${p}/src/`);
function views(bytes){const output=[['utf8',bytes.toString('utf8')]];for(const offset of [0,1]){const even=bytes.subarray(offset,offset+Math.floor((bytes.length-offset)/2)*2);output.push([`utf16le-${offset}`,even.toString('utf16le')]);output.push([`utf16be-${offset}`,Buffer.from(even).swap16().toString('utf16le')]);}return output;}
function sections(bytes){if(bytes.length<8||!bytes.subarray(0,8).equals(Buffer.from([0,97,115,109,1,0,0,0])))return [];let p=8;const out=[];const leb=()=>{let n=0,s=0,v;do{if(p>=bytes.length||s>35)throw Error('Invalid WASM section');v=bytes[p++];n+=(v&127)*2**s;s+=7;}while(v&128);return n;};while(p<bytes.length){const id=bytes[p++],size=leb(),start=p,end=p+size;assert.ok(end<=bytes.length);let name='';if(id===0){const length=leb();assert.ok(p+length<=end);name=bytes.subarray(p,p+length).toString('utf8');}out.push({id,name,start,end});p=end;}return out;}
export function inspectArtifact(bytes){
 const violations=[],sourcePaths=new Set(),virtualPaths=new Set(),canonicalRustPaths=new Set(),canonicalRustDepPaths=new Set();
 const rules={username:/kobayashi/gi,windowsAbsolute:/\b[A-Za-z]:[\\/]/g,uncAbsolute:/\\\\(?:[A-Za-z0-9_.-]+)\\[A-Za-z0-9_]/g,personalRoot:/(?<![A-Za-z0-9_.\\/])\/(?:home|Users|mnt|tmp|private|var|opt|usr|workspace|workspaces)\//g,cargoHome:/\.cargo[\\/]/g,rustupHome:/\.rustup[\\/]/g,privateKey:/-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,token:/\b(?:AKIA[A-Z0-9]{16}|ASIA[A-Z0-9]{16}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,}|sk-proj-[A-Za-z0-9_-]{40,}|npm_[A-Za-z0-9]{30,})\b/g,urlPassword:/https?:\/\/[^\s/:"']+:[^\s/"'@]+@/g,jwt:/\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\b/g,email:/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g};
 rules.serviceKey=/\bsk-[A-Za-z0-9]{32,}\b/g;
 rules.assignedSecret=/\b(?:password|api[_-]?key|access[_-]?token|client[_-]?secret)\s*[:=]\s*["'][^"'\r\n]{8,}["']/gi;
 rules.otherLocalRoot=/(?<![A-Za-z0-9_.\\/])\/(?:checkout|target)\/|(?<![A-Za-z0-9_.\\/])\/build\/(?!target(?:[\\/]|$))/g;
 for(const [encoding,text] of views(bytes)){
  for(const [rule,regex] of Object.entries(rules)){const count=[...text.matchAll(regex)].length;if(count)violations.push({encoding,rule,count});}
  for(const m of text.matchAll(/(?<![A-Za-z0-9_.\\/:])(?:[A-Za-z]:[\\/]|\/)[A-Za-z0-9_./\\:+-]{2,400}?\.rs/g)){
   const value=m[0].replaceAll('\\','/');sourcePaths.add(value);
   if(virtualPrefixes.some(prefix=>value.startsWith(prefix)))virtualPaths.add(value);
   else if(value.startsWith(canonicalRustPrefix))canonicalRustPaths.add(value);
   else if(canonicalRustDeps.some(p=>value.startsWith(p)))canonicalRustDepPaths.add(value);
   else {const prior=violations.find(v=>v.encoding===encoding&&v.rule==='nonvirtual-source-path');if(prior)prior.count++;else violations.push({encoding,rule:'nonvirtual-source-path',count:1});}
  }
 }
 const sectionPaths=sections(bytes).map(section=>({id:section.id,name:section.name,sourcePathCount:[...bytes.subarray(section.start,section.end).toString('utf8').matchAll(/(?<![A-Za-z0-9_.\\/:])(?:[A-Za-z]:[\\/]|\/)[A-Za-z0-9_./\\:+-]{2,400}?\.rs/g)].length})).filter(s=>s.sourcePathCount);
 return {passed:violations.length===0,violations,sourcePathCount:sourcePaths.size,virtualPathCount:virtualPaths.size,canonicalRustPathCount:canonicalRustPaths.size,canonicalRustDepPathCount:canonicalRustDepPaths.size,virtualPaths:[...virtualPaths].sort(),canonicalRustPaths:[...canonicalRustPaths].sort(),canonicalRustDepPaths:[...canonicalRustDepPaths].sort(),sectionPaths};
}
export function requireCleanArtifact(bytes,{wasm=false}={}){const report=inspectArtifact(bytes);assert.equal(report.passed,true,'Local path or sensitive string detected: '+JSON.stringify(report.violations));if(wasm){assert.ok(sections(bytes).length,'Valid WASM required');assert.ok(report.virtualPaths.some(p=>p.startsWith('/cargo/registry/')),'Expected normalized dependency source paths absent');}return report;}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const reportOnly=process.argv.includes('--report-only'),files=process.argv.slice(2).filter(x=>x!=='--report-only');
 if(!files.length)throw Error('Pass WASM and/or JavaScript file paths');
 for(const file of files){const bytes=await fs.readFile(file),report=reportOnly?inspectArtifact(bytes):requireCleanArtifact(bytes,{wasm:file.endsWith('.wasm')});console.log(JSON.stringify({file:path.basename(file),...report,virtualPaths:report.virtualPaths.slice(0,3),canonicalRustPaths:report.canonicalRustPaths.slice(0,3)},null,2));}
}
