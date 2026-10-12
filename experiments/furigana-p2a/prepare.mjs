// Generates ignored measurement assets. Does not change the production application.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
await fs.mkdir(path.join(root,'generated'),{recursive:true});
const names = ['base.dat.gz','check.dat.gz','cc.dat.gz','tid.dat.gz','tid_map.dat.gz','tid_pos.dat.gz','unk.dat.gz','unk_char.dat.gz','unk_compat.dat.gz','unk_invoke.dat.gz','unk_map.dat.gz','unk_pos.dat.gz'];
const dictionary = ['metadata.json','dict.trie','dict.valsidx','dict.vals','dict.wordsidx','dict.words','matrix.mtx','char_def.bin','unk.bin'];
const assets = [
  ...names.map(n=>'vendor/kuromoji/package/dict/'+n),
  'vendor/kuromoji/package/build/kuromoji.js',
  ...dictionary.map(n=>'vendor/ipadic/lindera-ipadic/'+n),
  'vendor/lindera/package/lindera_wasm.js','vendor/lindera/package/lindera_wasm_bg.wasm'
];
const manifest = [];
for(const relative of assets) {
  const bytes = await fs.readFile(path.join(root,relative));
  const raw = relative.endsWith('.dat.gz') ? zlib.gunzipSync(bytes) : bytes;
  manifest.push({path:relative,bytes:bytes.length,expandedBytes:raw.length,sha256:sha(bytes),
    gzipBytes:relative.endsWith('.dat.gz')?bytes.length:zlib.gzipSync(bytes,{level:9}).length,
    brotliBytes:relative.endsWith('.dat.gz')?null:zlib.brotliCompressSync(bytes).length});
}
for(const relative of ['vendor/lindera-wasm-6.2.0.tgz','vendor/kuromoji-0.1.2.tgz','vendor/lindera-ipadic-6.2.0.zip']) {
 const bytes=await fs.readFile(path.join(root,relative));
 manifest.push({path:relative,bytes:bytes.length,sha256:sha(bytes),sha512:'sha512-'+crypto.createHash('sha512').update(bytes).digest('base64')});
}
// Only instrument decompression duration; keep the unmodified bundle as primary benchmark.
let bundle = await fs.readFile(path.join(root,'vendor/kuromoji/package/build/kuromoji.js'),'utf8');
const needle='var typed_array = gz.decompress();';
if(bundle.split(needle).length!==2) throw new Error('Instrumentation patch must match exactly once');
bundle='/* P2a experimental modification: records gzip decompression duration, no algorithm change. Original Apache license and NOTICE in vendor/kuromoji/package. */\n'+bundle.replace(needle,
  'var p2aStart=performance.now(); var typed_array=gz.decompress(); globalThis.__decompression.push({url:url,ms:performance.now()-p2aStart,bytes:typed_array.byteLength});');
await fs.writeFile(path.join(root,'generated/kuromoji-instrumented.js'),bundle);
await fs.writeFile(path.join(root,'generated/assets.json'),JSON.stringify(manifest,null,2));
console.log(JSON.stringify(manifest.filter(x=>x.path.endsWith('.tgz')||x.path.endsWith('.zip')),null,2));
