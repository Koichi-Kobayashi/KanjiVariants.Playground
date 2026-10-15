import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'actions-policy-'));
const original = fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8');
const fixture = path.join(temp, 'workflow.yml');
const verify = (text, expected, extra = []) => {
  fs.writeFileSync(fixture, text);
  const result = spawnSync(process.execPath, [path.join(root, 'scripts/Verify-ActionsPolicy.mjs'), '--workflow', fixture, ...extra], { encoding: 'utf8' });
  assert.equal(result.status === 0, expected, result.stderr);
};
try {
  verify(original, true);
  verify(original.replace(/actions\/checkout@[a-f0-9]{40}/, 'actions/checkout@v7'), false);
  verify(original.replace('contents: read', 'contents: write'), false);
  verify(original.replace("if: github.ref == 'refs/heads/main'", 'if: always()'), false);
  verify(original.replace('needs: build', 'needs: other'), false);
  verify(original.replace('persist-credentials: false', 'persist-credentials: true'), false);
  verify(original.replace('run: ./scripts/Verify-FuriganaRedistribution.ps1', 'run: echo bypass'), false);
  const output = path.join(temp, 'output');
  const outside = path.join(temp, 'outside');
  fs.mkdirSync(output);
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(output, 'index.html'), 'fixture');
  verify(original, true, ['--artifact-root', output]);
  const outsideFile = path.join(outside, 'private.txt');
  const hardLink = path.join(output, 'hard-link.txt');
  fs.writeFileSync(outsideFile, 'fixture');
  fs.linkSync(outsideFile, hardLink);
  verify(original, false, ['--artifact-root', output]);
  fs.unlinkSync(hardLink);
  fs.symlinkSync(outside, path.join(output, 'escape'), process.platform === 'win32' ? 'junction' : 'dir');
  verify(original, false, ['--artifact-root', output]);
  verify(original, false, ['--artifact-root', path.join(temp, 'missing')]);
  console.log('Actions policy checks passed: baseline, 6 workflow tamper cases, normal output, hard link, escaping directory link and missing output.');
} finally {
  // Only this freshly created temporary fixture is removed; never traverse its junction target.
  const link = path.join(temp, 'output/escape');
  if (fs.existsSync(link)) {
    if (process.platform === 'win32') fs.rmdirSync(link);
    else fs.unlinkSync(link);
  }
  assert.equal(path.dirname(path.resolve(temp)), path.resolve(os.tmpdir()));
  assert(path.basename(temp).startsWith('actions-policy-'));
  fs.rmSync(temp, { recursive: true });
}
