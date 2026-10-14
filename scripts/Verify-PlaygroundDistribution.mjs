import path from 'node:path';
import {verifyWebcilAssembly} from './Verify-WebcilAssembly.mjs';
const root = path.resolve(process.argv[2] ?? 'artifacts/publish/wwwroot');
const linked = path.resolve(process.argv[3] ?? 'src/KanjiVariants.Playground/obj/Release/net10.0/linked/KanjiVariants.Playground.dll');
console.log(JSON.stringify({assembly:'KanjiVariants.Playground',webcil:verifyWebcilAssembly(root,linked,'KanjiVariants.Playground')},null,2));
