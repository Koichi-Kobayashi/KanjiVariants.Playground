// Production bridge lifecycle, UTF-8/UTF-16 normalization and pinned asset integrity.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
const root = new URL('../../src/KanjiVariants.Playground/wwwroot/', import.meta.url);
const source = await fs.readFile(new URL('js/furigana-worker.js', root), 'utf8');
const context = vm.createContext({ URL, TextEncoder, self: {} });
// Only the module URL is supplied by the harness; the production normalization is evaluated unchanged.
vm.runInContext(source.replaceAll('import.meta.url', JSON.stringify(new URL('js/furigana-worker.js', root).href)), context);
const text = '😀辻\u{E0100} 今日\n𠮷';
const raw = [{ byteStart: 12, byteEnd: 18, surface: '今日', details: [...Array(7).fill('*'), 'キョウ'], isUnknown: false }];
context.testText = text; context.testRaw = raw;
let mapped = vm.runInContext('normalize(testText, testRaw)', context);
assert.equal(mapped[0].start, 6); assert.equal(mapped[0].end, 8); assert.equal(mapped[0].valid, true);
context.testRaw = [{ ...raw[0], byteStart: 1 }];
assert.equal(vm.runInContext('normalize(testText, testRaw)', context)[0].valid, false);
context.testRaw = [raw[0], raw[0]];
assert.equal(vm.runInContext('normalize(testText, testRaw)', context)[1].valid, false);
context.testText = '\uD800';
assert.throws(() => vm.runInContext('normalize(testText, [])', context), /UTF-16/);
context.fetch=async()=>({ok:true,json:async()=>({wasm:{sha256:'52f4b492f9dd0edf876b90d3432ae2284b2d996bf8e697327d1fc3b0277e6431'}})});
await assert.rejects(vm.runInContext('initialize()',context),/採用済みエンジン/,'Cached official manifest cannot silently load the old engine');
context.fetch=async()=>({ok:true,json:async()=>({buildOrigin:'self-built',wasm:{sha256:'unreviewed'}})});
await assert.rejects(vm.runInContext('initialize()',context),/採用済みエンジン/,'Unreviewed self-build rejected before import');

let instances = 0, initCalls = 0, terminated = 0, failNext = false;
class WorkerStub {
    constructor(url, options) { instances++; assert.ok(url.href.endsWith('/js/furigana-worker.js')); assert.equal(options.type, 'module'); }
    postMessage(data) {
        if (data.command === 'init') initCalls++;
        queueMicrotask(() => { const error = failNext; failNext = false; this.onmessage({ data: { id: data.id, tokens: [{ surface: data.text }], ...(error ? { error: 'test failure' } : {}) } }); });
    }
    terminate() { terminated++; }
}
globalThis.Worker = WorkerStub;
const client = await import(new URL('js/furigana-client.js', root));
assert.equal(instances, 0, 'import alone must not load dictionary');
await Promise.all([client.analyze('今日'), client.analyze('宇宙')]);
assert.equal(instances, 1); assert.equal(initCalls, 1);
await client.analyze('図書館'); assert.equal(initCalls, 1);
failNext = true; await assert.rejects(client.analyze('今日'), /test failure/);
assert.equal(terminated, 1);
await client.analyze('今日'); assert.equal(instances, 2); assert.equal(initCalls, 2);
client.dispose(); assert.equal(terminated, 2);
delete globalThis.Worker;

const assets = new URL('furigana/lindera-6.2.0/', root);
const manifest = JSON.parse(await fs.readFile(new URL('manifest.json', assets), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(manifest.version, '6.2.0'); assert.equal(manifest.dictionaryFormat, 2);
assert.equal(manifest.buildOrigin,'self-built');
assert.equal(manifest.wasm.sha256,'fbe6bf9a280f10f7e897fb88d997838c6c1bf1df20bf288ea3df23962a1897ba');
assert.equal(manifest.publicationApproved, false); assert.ok(manifest.publicationBlockers.length > 0);
for (const asset of [manifest.javascript, manifest.wasm, ...manifest.dictionary]) {
    const bytes = await fs.readFile(new URL(asset.file, assets));
    assert.equal(bytes.length, asset.bytes); assert.equal(sha(bytes), asset.sha256);
    if (asset.gzip) { const raw = gunzipSync(bytes); assert.equal(raw.length, asset.rawBytes); assert.equal(sha(raw), asset.rawSha256); }
}
assert.ok((await fs.readFile(new URL('LICENSE', assets), 'utf8')).includes('MIT'));
assert.ok((await fs.readFile(new URL('IPADIC-NOTICE.txt', assets), 'utf8')).includes('ICOT'));
console.log('Worker checks passed: Unicode positions, lazy initialization/reuse/retry, asset hashes and notices.');
