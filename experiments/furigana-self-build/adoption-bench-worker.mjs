// Experimental stage timing; production Worker and its API are unchanged.
self.onmessage=async()=>{
 try {
  const base=new URL('./furigana/lindera-6.2.0/',import.meta.url),start=performance.now();
  const checked=async asset=>{
   const response=await fetch(new URL(asset.file,base));if(!response.ok)throw Error('Fetch failed');
   const bytes=await response.arrayBuffer();
   const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
   if(sha!==asset.sha256)throw Error('Hash mismatch');
   return asset.gzip?new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()):new Uint8Array(bytes);
  };
  const manifest=await(await fetch(new URL('manifest.json',base))).json();
  const module=await import(new URL('lindera_wasm.js',base));
  const fetchStart=performance.now(),wasmBytes=await checked(manifest.wasm),wasmFetchAndHashMs=performance.now()-fetchStart;
  const instantiateStart=performance.now(),wasm=await module.default({module_or_path:wasmBytes}),wasmInstantiateMs=performance.now()-instantiateStart;
  const dictionaryStart=performance.now(),arrays=await Promise.all(manifest.dictionary.map(checked)),dictionaryLoadHashExpandMs=performance.now()-dictionaryStart;
  const tokenizerStart=performance.now(),tokenizer=new module.Tokenizer(module.loadDictionaryFromBytes(...arrays),'normal'),tokenizerMs=performance.now()-tokenizerStart;
  const workerInitializationMs=performance.now()-start;
  const text='今日は図書館で宇宙の本を読みます。'.repeat(120).slice(0,2000),samples=[];
  const firstStart=performance.now();tokenizer.tokenize(text);const firstAnalysisMs=performance.now()-firstStart;
  for(let i=0;i<11;i++){const t=performance.now();tokenizer.tokenize(text);samples.push(performance.now()-t);}
  samples.sort((a,b)=>a-b);
  self.postMessage({wasmFetchAndHashMs,wasmInstantiateMs,dictionaryLoadHashExpandMs,tokenizerMs,workerInitializationMs,firstAnalysisMs,repeatedAnalysisMedianMs:samples[5],wasmLinearBytes:wasm.memory.buffer.byteLength});
 }catch(e){self.postMessage({error:String(e.stack??e)});}
};
