// Limited, conservative okurigana alignment against actual engine tokens and library units.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const education=JSON.parse(await fs.readFile(path.join(root,'generated/education.json'),'utf8'));
const hira=text=>text.replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-96));
const output=[];
for(const kind of ['lindera','kuromoji']) {
 const run=JSON.parse(await fs.readFile(path.join(root,`results/${kind}-main-cold-gzip-0.json`),'utf8'));
 for(const id of ['today','adult','library','space','live','read-past','went','ate']) {
  const item=run.cases.find(x=>x.id===id),diagnosis=education[id][0];
  const token=item.safe[0];
  const units=diagnosis.items.filter(x=>x.utf16Index>=token.start&&x.utf16Index<token.end);
  let prefix=0;
  for(const unit of units) {if([1,2,3].includes(unit.reason))prefix+=unit.utf16Length;else break;}
  const suffix=token.surface.slice(prefix),reading=hira(token.reading);
  const canSplit=prefix>0&&suffix.length>0&&/^[ぁ-ゖァ-ヶー]+$/.test(suffix)&&reading.endsWith(hira(suffix))&&reading.length>suffix.length;
  const range={kind,id,surface:token.surface,base:token.base,fullReading:reading,
    rubySurface:canSplit?token.surface.slice(0,prefix):token.surface,
    rubyReading:canSplit?reading.slice(0,-suffix.length):reading,suffix:canSplit?suffix:'',
    strategy:canSplit?'unique-trailing-kana':'whole-word',
    unlearned:units.filter(x=>[2,3].includes(x.reason)).length};
  output.push(range);
 }
}
for(const kind of ['lindera','kuromoji']) {
 for(const [id,surface,reading] of [['live','生','い'],['read-past','読','よ'],['went','行','い'],['ate','食','た']]) {
  const row=output.find(x=>x.kind===kind&&x.id===id);assert.equal(row.rubySurface,surface);assert.equal(row.rubyReading,reading);
 }
 for(const id of ['today','adult','library','space'])assert.equal(output.find(x=>x.kind===kind&&x.id===id).strategy,'whole-word');
}
await fs.writeFile(path.join(root,'results/alignment.json'),JSON.stringify(output,null,2));
console.log(JSON.stringify(output,null,2));
