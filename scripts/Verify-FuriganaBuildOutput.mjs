import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {pins} from './FuriganaSelfBuildPolicy.mjs';
import {requireCleanArtifact} from './Verify-FuriganaPaths.mjs';
const directory=process.argv[2];if(!directory)throw Error('Pass the normalized pkg directory');
for(const [file,hash] of [['lindera_wasm_bg.wasm',pins.wasm],['lindera_wasm.js',pins.javascript]]){const bytes=await fs.readFile(path.join(directory,file));requireCleanArtifact(bytes,{wasm:file.endsWith('.wasm')});assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),hash,'Unreviewed normalized build output: '+file);}
console.log('Normalized output hashes and path/privacy inspection passed.');
