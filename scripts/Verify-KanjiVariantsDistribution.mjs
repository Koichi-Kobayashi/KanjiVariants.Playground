import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import os from 'node:os';
import {brotliDecompressSync, gunzipSync} from 'node:zlib';

// Compare the official package, linker output and actual Webcil payload.
// Format reference: dotnet/runtime docs/design/mono/webcil.md, payload v0.
const root = path.resolve(process.argv[2] ?? 'artifacts/publish/wwwroot');
const pkg = path.resolve(process.argv[3] ?? path.join(process.env.NUGET_PACKAGES ?? path.join(os.homedir(), '.nuget/packages'), 'kanjivariants/1.2.1'));
const linked = path.resolve(process.argv[4] ?? 'src/KanjiVariants.Playground/obj/Release/net10.0/linked/KanjiVariants.dll');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
assert.equal(sha(fs.readFileSync(path.join(pkg, 'lib/net6.0/KanjiVariants.dll'))), '93868274916acb2741b75289bb2e594539c1baf186fb0f9565c670129bb1bb2c');
assert.deepEqual(fs.readFileSync('src/KanjiVariants.Playground/bin/Release/net10.0/KanjiVariants.dll'), fs.readFileSync(path.join(pkg, 'lib/net6.0/KanjiVariants.dll')), 'Actual Release build input must be the official DLL');
assert.equal(sha(fs.readFileSync(path.join(pkg, 'LICENSE-NOTICES.md'))), '1aa7cbcad450960c7258f9a9a5cb7918f48b113dc01d57b9ab61330af395082a');
assert.equal(sha(fs.readFileSync(path.join(pkg, 'data/JIS/Unicode-LICENSE.txt'))), 'e7a93b009565cfce55919a381437ac4db883e9da2126fa28b91d12732bc53d96');
for (const [source, notice] of [['LICENSE-NOTICES.md','KanjiVariants-1.2.1.txt'],['data/JIS/JIS0208.TXT','KanjiVariants-1.2.1-JIS0208.TXT'],['data/JIS/Unicode-LICENSE.txt','KanjiVariants-1.2.1-Unicode-LICENSE.txt']]) {
    assert.deepEqual(fs.readFileSync(path.join(root, 'licenses', notice)), fs.readFileSync(path.join(pkg, source)), notice);
}
assert.equal(sha(fs.readFileSync(path.join(root, 'licenses/KanjiVariants-1.2.1-JIS0208.TXT'))), '1c571870457f19c97720631fa83ee491549a96ba1436da1296786a67d8632e87');
assert.ok(!fs.readdirSync(path.join(root,'licenses')).some(n => n.startsWith('KanjiVariants-1.2.0')));
const pe = fs.readFileSync(linked), peStart = pe.readUInt32LE(0x3c), optional = peStart + 24;
assert.equal(pe.toString('ascii', peStart, peStart+4), 'PE\0\0');
const sectionCount = pe.readUInt16LE(peStart+6), table = optional+pe.readUInt16LE(peStart+20);
const sections = Array.from({length:sectionCount}, (_,i) => {const o=table+i*40;return {size:pe.readUInt32LE(o+8),rva:pe.readUInt32LE(o+12),rawSize:pe.readUInt32LE(o+16),offset:pe.readUInt32LE(o+20)};});
const dataDirectories = optional+(pe.readUInt16LE(optional)===0x10b?96:112);
function mappedOffset(rows, rva) {const s=rows.find(s=>rva>=s.rva && rva<s.rva+Math.max(s.size,s.rawSize));assert.ok(s,'Unmapped RVA');return s.offset+rva-s.rva;}
function leb(b, at) {let n=0,shift=0,v;do{assert.ok(at<b.length,'Truncated LEB128');v=b[at++];assert.ok(shift<35);n+=(v&127)*2**shift;shift+=7;}while(v&128);return [n,at];}
function payload(b) {
    assert.equal(b.subarray(0,8).toString('hex'),'0061736d01000000');
    for(let p=8;p<b.length;){const id=b[p++];let length;[length,p]=leb(b,p);const end=p+length;assert.ok(end<=b.length,'Truncated WASM section');if(id===11){let count;[count,p]=leb(b,p);assert.equal(count,2);const segments=[];for(let i=0;i<count;i++){let flag,size;[flag,p]=leb(b,p);assert.equal(flag,1,'Expected passive Mono Webcil data');[size,p]=leb(b,p);assert.ok(p+size<=end,'Truncated data segment');segments.push(b.subarray(p,p+size));p+=size;}assert.equal(p,end);assert.equal(segments[0].readUInt32LE(),segments[1].length);return segments[1];}p=end;}
    throw Error('Webcil payload missing');
}
const framework = path.join(root,'_framework');
const files = fs.readdirSync(framework).filter(n=>/^KanjiVariants\.(?!Playground\.)/.test(n)&&/\.wasm(?:\.br|\.gz)?$/.test(n));
assert.equal(files.filter(n=>n.endsWith('.wasm')).length,1);
const results=[];
const canonical = fs.readFileSync(path.join(framework,files.find(n=>n.endsWith('.wasm'))));
assert.ok(!fs.readdirSync(framework).some(n=>/^KanjiVariants(?:\.|$)/.test(n)&&!n.startsWith('KanjiVariants.Playground.')&&!files.includes(n)),'Unexpected KanjiVariants artifact (old DLL/PDB)');
for(const file of files){
    let raw=fs.readFileSync(path.join(framework,file));if(file.endsWith('.br'))raw=brotliDecompressSync(raw);if(file.endsWith('.gz'))raw=gunzipSync(raw);
    assert.deepEqual(raw,canonical,'Compressed Webcil must match the entire raw artifact');
    const b=payload(raw);assert.equal(b.toString('ascii',0,4),'WbIL');assert.equal(b.readUInt16LE(4),0);assert.equal(b.readUInt16LE(6),0);assert.equal(b.readUInt16LE(8),sectionCount);
    const rows=sections.map((s,i)=>{const o=28+i*16;const row={size:b.readUInt32LE(o),rva:b.readUInt32LE(o+4),rawSize:b.readUInt32LE(o+8),offset:b.readUInt32LE(o+12)};assert.equal(row.size,s.size);assert.equal(row.rva,s.rva);assert.equal(row.rawSize,s.rawSize);return row;});
    const expected=sections.map(s=>Buffer.from(pe.subarray(s.offset,s.offset+s.rawSize)));
    const debugRva=b.readUInt32LE(20),debugSize=b.readUInt32LE(24);
    assert.equal(debugSize%28,0);
    assert.equal(debugRva,pe.readUInt32LE(dataDirectories+6*8));assert.equal(debugSize,pe.readUInt32LE(dataDirectories+6*8+4));
    // Webcil conversion remaps debug directory file pointers to payload offsets.
    for(let d=0;d<debugSize;d+=28){const rva=debugRva+d;const i=sections.findIndex(s=>rva>=s.rva&&rva<s.rva+s.size);const at=rva-sections[i].rva;const dataRva=expected[i].readUInt32LE(at+20);if(dataRva)expected[i].writeUInt32LE(mappedOffset(rows,dataRva),at+24);}
    rows.forEach((s,i)=>assert.deepEqual(b.subarray(s.offset,s.offset+s.rawSize),expected[i],file+' section '+i));
    const codeViews=[];
    for(let d=0;d<debugSize;d+=28){const o=mappedOffset(rows,debugRva+d);if(b.readUInt32LE(o+12)!==2)continue;const cv=b.readUInt32LE(o+24),size=b.readUInt32LE(o+16);assert.equal(b.toString('ascii',cv,cv+4),'RSDS');const name=b.subarray(cv+24,cv+size).toString('utf8').replace(/\0.*$/s,'');assert.match(name,/^\/_\//);codeViews.push(name);}
    assert.ok(codeViews.length);
    const patterns=/(?<![A-Za-z0-9_])[A-Za-z]:[\\/]|\/(?:Users|home)\//;
    for(const text of [raw.toString('utf8'),raw.toString('utf16le'),Buffer.from(raw.subarray(0,raw.length-raw.length%2)).swap16().toString('utf16le')])assert.ok(!patterns.test(text),file+' local path');
    results.push({file,sha256:sha(raw),sectionsMatched:rows.length,codeViews,localAbsolutePaths:0});
}
assert.ok(results.some(x=>x.file.endsWith('.br')) && results.some(x=>x.file.endsWith('.gz')));
console.log(JSON.stringify({officialVersion:'1.2.1',noticesMatched:3,webcil:results},null,2));
