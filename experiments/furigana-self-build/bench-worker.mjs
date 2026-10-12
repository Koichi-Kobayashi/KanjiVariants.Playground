self.onmessage=async({data})=>{
 try {
  const base=new URL(`../${data.kind}/furigana/lindera-6.2.0/`,import.meta.url),start=performance.now();
  const manifest=await(await fetch(new URL('manifest.json',base))).json();
  const module=await import(new URL('lindera_wasm.js',base));
  const wasm=await module.default({module_or_path:await(await fetch(new URL('lindera_wasm_bg.wasm',base))).arrayBuffer()});
  const arrays=await Promise.all(manifest.dictionary.map(async a=>{
   const bytes=await(await fetch(new URL(a.file,base))).arrayBuffer();
   return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
  }));
  const dictionary=module.loadDictionaryFromBytes(...arrays),tokenizer=new module.Tokenizer(dictionary,'normal');
  const initializationMs=performance.now()-start;
  const analyses=data.texts.map(text=>({text,tokens:tokenizer.tokenize(text)}));
  const samples=[];const text='今日は図書館で宇宙の本を読みます。'.repeat(120).slice(0,2000);
  for(let i=0;i<12;i++){const begin=performance.now();tokenizer.tokenize(text);if(i)samples.push(performance.now()-begin);}
  samples.sort((a,b)=>a-b);
  self.postMessage({kind:data.kind,initializationMs,analysis2000MedianMs:samples[5],wasmLinearBytes:wasm.memory.buffer.byteLength,analyses});
 }catch(error){self.postMessage({error:String(error.stack??error)});}
};
