import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const options = new Set(['--upstream', '--workflow', '--artifact-root']);
for (let i = 0; i < args.length; i++) {
  assert(options.has(args[i]), `Unknown option: ${args[i]}`);
  if (args[i] !== '--upstream') assert(args[++i], 'Missing option value');
}
const value = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const policy = JSON.parse(fs.readFileSync(path.join(root, 'scripts/actions-policy.json')));
const text = fs.readFileSync(value('--workflow') ?? path.join(root, '.github/workflows/pages.yml'), 'utf8');
const direct = policy.actions.filter(a => a.action !== 'actions/upload-artifact');
const refs = [...text.matchAll(/^\s*- uses: (\S+) # (\S+)\s*$/gm)].map(m => [m[1], m[2]]);
assert.equal((text.match(/\buses:/g) ?? []).length, direct.length, 'Unexpected Action reference');
assert.deepEqual(refs, direct.map(a => [`${a.action}@${a.commit}`, a.release]));
for (const a of policy.actions) assert.match(a.commit, /^[a-f0-9]{40}$/);
// These are deliberately narrow checks for this workflow, not a YAML parser or a general security proof.
assert.match(text, /^permissions:\r?\n  contents: read\r?\n/m);
assert.equal((text.match(/\bpermissions:/g) ?? []).length, 2, 'Review additional permission overrides');
assert.match(text, /persist-credentials: false/);
assert.match(text, /global-json-file: global.json\r?\n          cache: false/);
assert.match(text, /^  deploy:\r?\n    if: github.ref == 'refs\/heads\/main'\r?\n    needs: build\r?\n/m);
assert.match(text, /    permissions:\r?\n      pages: write\r?\n      id-token: write\r?\n/);
assert(!/pull_request|workflow_run|issues:|secrets\.|continue-on-error|always\(/.test(text), 'Review new trust boundary explicitly');
const gate = text.indexOf('run: ./scripts/Verify-FuriganaRedistribution.ps1');
assert.match(text, /      - name: Verify furigana redistribution approval\r?\n        shell: pwsh\r?\n        run: \.\/scripts\/Verify-FuriganaRedistribution.ps1\r?\n/);
const upload = text.indexOf('uses: actions/upload-pages-artifact@');
assert(gate > 0 && upload > gate, 'Approval must run before upload');
assert(!/\n\s+if:/.test(text.slice(gate, upload)), 'Upload condition must not bypass failure');
const artifactRoot = value('--artifact-root');
if (artifactRoot) {
  // Upstream tar dereferences links. Reject them before any upload, including directory junctions.
  const visit = entry => {
    const info = fs.lstatSync(entry);
    assert(!info.isSymbolicLink(), `Pages output contains a link: ${entry}`);
    assert(!info.isFile() || info.nlink === 1, `Pages output contains a hard-linked file: ${entry}`);
    if (info.isDirectory()) for (const name of fs.readdirSync(entry)) visit(path.join(entry, name));
  };
  visit(path.resolve(artifactRoot));
}
if (args.includes('--upstream')) {
  const get = async url => {
    const response = await fetch(url, { headers: { 'User-Agent': 'KanjiVariants-Actions-Audit' } });
    assert(response.ok, `${url}: ${response.status}`);
    return response;
  };
  for (const a of policy.actions) {
    const release = await (await get(`https://api.github.com/repos/${a.action}/releases/tags/${a.release}`)).json();
    assert(!release.draft && !release.prerelease);
    assert.equal(release.tag_name, a.release);
    const commit = await (await get(`https://api.github.com/repos/${a.action}/commits/${a.release}`)).json();
    assert.equal(commit.sha, a.commit, `${a.action}: release tag moved`);
    for (const [file, expected] of Object.entries(a.files)) {
      const bytes = Buffer.from(await (await get(`https://raw.githubusercontent.com/${a.action}/${a.commit}/${file}`)).arrayBuffer());
      assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), expected, `${a.action}/${file}`);
      if (file === 'action.yml') {
        const definition = bytes.toString('utf8');
        assert(definition.includes(a.runtime));
        const nested = [...definition.matchAll(/uses:\s*(\S+)/g)].map(m => m[1]);
        assert.deepEqual(nested, a.nested);
      }
    }
  }
}
console.log('Reviewed Action references, permissions and approval order verified' + (artifactRoot ? '; Pages output contains no links' : '') + '.');
