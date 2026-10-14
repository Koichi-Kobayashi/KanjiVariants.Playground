import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import os from 'node:os';
import {verifyWebcilAssembly} from './Verify-WebcilAssembly.mjs';

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
const results = verifyWebcilAssembly(root, linked, 'KanjiVariants');
console.log(JSON.stringify({officialVersion:'1.2.1',noticesMatched:3,webcil:results},null,2));
