import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {inspectArtifact,requireCleanArtifact} from '../../scripts/Verify-FuriganaPaths.mjs';
const good=['/cargo/registry/regex-automata/src/meta/strategy.rs','/cargo/registry\\regex-automata\\src\\meta\\strategy.rs','/src/lindera/lindera/src/tokenizer.rs','/rust/toolchain/library/core/src/lib.rs','/build/target/generated.rs','/rustc/48a229ceaefd4985c50990b14116b6d856af0985/library/core/src/lib.rs','lindera/src/tokenizer.rs','https://example.org/license'];
good.push('/src/lindera/home/example.rs','/cargo/registry/example/src/tmp/example.rs');
for(const value of good)for(const encoding of ['utf8','utf16le','utf16be'])for(const offset of [0,1]){let bytes=Buffer.from(value,encoding==='utf16be'?'utf16le':encoding);if(encoding==='utf16be')bytes=bytes.swap16();if(offset)bytes=Buffer.concat([Buffer.from([0]),bytes]);assert.equal(inspectArtifact(bytes).passed,true,value);}
for(const crate of ['rustc-demangle-0.1.27','hashbrown-0.17.1','dlmalloc-0.2.13'])assert.equal(inspectArtifact(Buffer.from(`/rust/deps/${crate}/src/lib.rs`)).passed,true);
assert.equal(inspectArtifact(Buffer.from('/rust/deps/unreviewed/src/lib.rs')).passed,false);
const bad=['C:\\Users\\alice\\.cargo\\registry\\src\\lib.rs','D:/workspace/project/source.rs','/home/alice/src/main.rs','/checkout/project/private.rs','\\\\host\\share\\src\\lib.rs','kobayashi','-----BEGIN PRIVATE KEY-----','ghp_'+'A'.repeat(40),'alice@example.org'];
let cases=good.length*6+4;
for(const value of bad)for(const encoding of ['utf8','utf16le','utf16be'])for(const offset of [0,1]){
 let bytes=Buffer.from(value,encoding==='utf16be'?'utf16le':encoding);if(encoding==='utf16be')bytes=bytes.swap16();if(offset)bytes=Buffer.concat([Buffer.from([0]),bytes]);assert.equal(inspectArtifact(bytes).passed,false,`${encoding}/${offset} must reject local/sensitive string`);cases++;
}
const source=new URL('../../src/KanjiVariants.Playground/wwwroot/furigana/lindera-6.2.0/',import.meta.url);
// Enable only after the reviewed normalized artifact is installed.
if(!process.argv.includes('--fixtures-only')){requireCleanArtifact(await fs.readFile(new URL('lindera_wasm_bg.wasm',source)),{wasm:true});requireCleanArtifact(await fs.readFile(new URL('lindera_wasm.js',source)));}
console.log(`Path checks passed: ${cases} virtual/relative/UTF-8/UTF-16/credential cases.`);
