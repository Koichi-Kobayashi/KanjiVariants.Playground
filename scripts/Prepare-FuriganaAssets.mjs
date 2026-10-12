// Package exactly the P2a-verified artifacts; never resolve "latest".
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(root,'experiments/furigana-p2a/vendor');
const target=path.join(root,'src/KanjiVariants.Playground/wwwroot/furigana/lindera-6.2.0');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const [file,expected] of [
 ['lindera-ipadic-6.2.0.zip','5ed4bba6b429030b0387df67d40d5751d35dedef0306f4bac6d957cad5f04b72'],
 ['lindera/package/lindera_wasm.js','a9e082fca426d6d225a439bac39c9d690aa5176598d7c902ca71e1fe4ba8d03a'],
 ['lindera/package/lindera_wasm_bg.wasm','52f4b492f9dd0edf876b90d3432ae2284b2d996bf8e697327d1fc3b0277e6431']
])if(hash(await fs.readFile(path.join(source,file)))!==expected)throw new Error('Unverified artifact: '+file);
await fs.mkdir(target,{recursive:true});
const manifest={engine:'lindera-wasm',version:'6.2.0',dictionaryId:'lindera-ipadic-6.2.0',dictionaryFormat:2,
 publicationApproved:false,publicationBlockers:['IPADIC原典20250920とNOTICE内20070801の表記照合','WASM第三者crate通知の最終確認'],dictionary:[]};
for(const file of ['lindera_wasm.js','lindera_wasm_bg.wasm','LICENSE']) {
 const bytes=await fs.readFile(path.join(source,'lindera/package',file));await fs.writeFile(path.join(target,file),bytes);
 if(file.endsWith('.wasm'))manifest.wasm={file,sha256:hash(bytes),bytes:bytes.length};
 if(file.endsWith('.js'))manifest.javascript={file,sha256:hash(bytes),bytes:bytes.length};
}
for(const file of ['metadata.json','dict.trie','dict.valsidx','dict.vals','dict.wordsidx','dict.words','matrix.mtx','char_def.bin','unk.bin']) {
 const bytes=await fs.readFile(path.join(source,'ipadic/lindera-ipadic',file)),gzip=zlib.gzipSync(bytes,{level:9});
 await fs.writeFile(path.join(target,file+'.gz'),gzip);
 manifest.dictionary.push({file:file+'.gz',gzip:true,sha256:hash(gzip),rawSha256:hash(bytes),bytes:gzip.length,rawBytes:bytes.length});
}
await fs.copyFile(path.join(source,'ipadic/lindera-ipadic/NOTICE.txt'),path.join(target,'IPADIC-NOTICE.txt'));
await fs.writeFile(path.join(target,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Prepared pinned assets; publication approval remains false.');
