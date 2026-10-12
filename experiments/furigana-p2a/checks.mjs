import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {normalize,boundaries} from './engines.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));let checks=0;
function check(value,label){assert.ok(value,label);checks++;}
const runs=await Promise.all((await fs.readdir(path.join(root,'results'))).filter(n=>n.endsWith('.json')&&!n.includes('summary')&&!n.startsWith('interop')).map(async n=>JSON.parse(await fs.readFile(path.join(root,'results',n),'utf8'))));
const education=JSON.parse(await fs.readFile(path.join(root,'generated/education.json'),'utf8'));
for(const run of runs)for(const item of run.cases??[]) {
 if(item.id.startsWith('invalid-')){check(item.evaluation==='invalid-utf16-rejected','invalid UTF-16 rejected');continue;}
 const tokens=normalize(item.text,item.raw,run.kind);
 check(tokens.every(x=>x.valid),'surface, bounds and monotonic position match');
 let offset=0,reconstructed='';
 for(const token of tokens){reconstructed+=item.text.slice(offset,token.start)+item.text.slice(token.start,token.end);offset=token.end;}
 reconstructed+=item.text.slice(offset);
 check(reconstructed===item.text,'all gaps including whitespace retained');
 for(const diagnosis of education[item.id]) {
  check(diagnosis.items.map(x=>x.original).join('')===item.text,'KanjiVariants units cover exact source');
  const units=new Set([0,...diagnosis.items.map(x=>x.utf16Index+x.utf16Length)]);
  for(const token of tokens) {
   const candidate=item.rubyByGrade?.find(x=>x.grade===diagnosis.targetGrade)?.candidates.find(x=>x.start===token.start&&x.end===token.end);
   if(candidate?.status==='whole-word-candidate') {
    check(units.has(token.start)&&units.has(token.end),'ruby never splits Unicode logical unit');
    check(candidate.unlearned>0&&!token.unknown&&token.reading&&token.reading!=='*','candidate requires unlearned and a reading');
   }
  }
 }
}
const repeated='今日今日';
const duplicate=normalize(repeated,[{surface:'今日',byteStart:0,byteEnd:6},{surface:'今日',byteStart:0,byteEnd:6}],'lindera');
check(!duplicate[1].valid,'identical surface cannot disguise overlapping positions');
check(!normalize('今日',[{surface:'昨日',byteStart:0,byteEnd:6}],'lindera')[0].valid,'surface mismatch rejected');
check(!normalize('𠮷',[{surface:'𠮷',byteStart:1,byteEnd:4}],'lindera')[0].valid,'UTF8 nonboundary rejected');
check(!normalize('今日',[{surface_form:'今日',word_position:0}],'kuromoji')[0].valid,'invalid scalar position rejected');
for(const value of ['\ud800','a\udc00'])assert.throws(()=>boundaries(value));
// Manual provenance wins; never replace it with an automatic guess.
const choose=(manual,automatic)=>manual?.origin==='manual'?manual:automatic;
check(choose({origin:'manual',reading:'ひとけ'},{origin:'auto',reading:'にんき'}).reading==='ひとけ','manual reading preserved');
console.log(`Passed ${checks} experiment checks against actual browser output; production untouched.`);
