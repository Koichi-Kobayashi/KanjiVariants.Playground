// Engine-specific code is isolated here; no production dependency or source change.
const encoder=new TextEncoder();
export function boundaries(text) {
 const utf8=new Map([[0,0]]), scalar=[0];let bytes=0,units=0;
 for(const ch of text) {
  const cp=ch.codePointAt(0);if(cp>=0xd800&&cp<=0xdfff)throw new Error('Invalid UTF-16: reject before encoding');
  units+=ch.length;bytes+=encoder.encode(ch).length;utf8.set(bytes,units);scalar.push(units);
 }
 return {utf8,scalar};
}
export function normalize(text,raw,kind) {
 const map=boundaries(text);
 let previousEnd=0;
 return raw.map(t=>{
  const start=kind==='lindera'?map.utf8.get(t.byteStart):map.scalar[t.word_position-1];
  const end=kind==='lindera'?map.utf8.get(t.byteEnd):start+(t.surface_form??'').length;
  const surface=t.surface??t.surface_form;
  const valid=Number.isInteger(start)&&Number.isInteger(end)&&end>start&&start>=previousEnd&&end<=text.length&&text.slice(start,end)===surface;
  if(valid)previousEnd=end;
  return {start,end,surface,reading:kind==='lindera'?t.details?.[7]:t.reading,
   pos:kind==='lindera'?t.details?.slice(0,4):[t.pos,t.pos_detail_1,t.pos_detail_2,t.pos_detail_3],
   base:kind==='lindera'?t.details?.[6]:t.basic_form,
   unknown:kind==='lindera'?t.isUnknown:t.word_type==='UNKNOWN',valid,raw:t};
 });
}
export function memory(wasm) {
 return {jsHeap:performance.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize,limit:performance.memory.jsHeapSizeLimit}:null,
  wasmLinearBytes:wasm?.memory?.buffer.byteLength??null};
}
export function resources() {
 return performance.getEntriesByType('resource').map(e=>({url:e.name,initiator:e.initiatorType,
   ms:e.duration,transfer:e.transferSize,encoded:e.encodedBodySize,decoded:e.decodedBodySize,
   responseEnd:e.responseEnd,start:e.startTime}));
}
export async function initialize(kind,options={}) {
 const base=new URL('./',import.meta.url);
 const suffix=options.cache==='cold'?`?cache=cold&run=${options.run}&compression=${options.compression??'gzip'}`:`?compression=${options.compression??'gzip'}`;
 const url=p=>new URL(p,base).href+suffix;
 const stats={kind,cache:options.cache,before:memory(),decompression:null};
 const start=performance.now();let tokenizer,wasm;
 if(kind==='lindera') {
  const module=await import(url('vendor/lindera/package/lindera_wasm.js'));stats.jsLoad=performance.now()-start;
  let time=performance.now();const response=await fetch(url('vendor/lindera/package/lindera_wasm_bg.wasm'));
  const bytes=await response.arrayBuffer();stats.wasmFetch=performance.now()-time;
  time=performance.now();wasm=await module.default({module_or_path:bytes});stats.wasmInit=performance.now()-time;
  stats.afterWasm=memory(wasm);time=performance.now();
  const names=['metadata.json','dict.trie','dict.valsidx','dict.vals','dict.wordsidx','dict.words','matrix.mtx','char_def.bin','unk.bin'];
  let arrays=await Promise.all(names.map(async name=>new Uint8Array(await (await fetch(url('vendor/ipadic/lindera-ipadic/'+name))).arrayBuffer())));
  stats.dictionaryFetch=performance.now()-time;stats.dictionaryRawBytes=arrays.reduce((a,x)=>a+x.byteLength,0);stats.afterFetch=memory(wasm);
  time=performance.now();const dictionary=module.loadDictionaryFromBytes(...arrays);
  // The generated constructor consumes Dictionary via __destroy_into_raw().
  tokenizer=new module.Tokenizer(dictionary,'normal');arrays=null;
  stats.dictionaryInit=performance.now()-time;
 } else {
  globalThis.__decompression=[];
  await import(url(options.instrumented?'generated/kuromoji-instrumented.js':'vendor/kuromoji/package/build/kuromoji.js'));
  stats.jsLoad=performance.now()-start;
  // Add transport controls without changing tokenizer code. Restore the original afterwards.
  const original=XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open=function(method,address,...args) {return original.call(this,method,address+suffix,...args);};
  const time=performance.now();
  try {tokenizer=await new Promise((resolve,reject)=>globalThis.kuromoji.builder({dicPath:new URL('vendor/kuromoji/package/dict/',base).pathname}).build((error,result)=>error?reject(error):resolve(result)));}
  finally {XMLHttpRequest.prototype.open=original;}
  stats.dictionaryFetchAndInit=performance.now()-time;
  stats.decompression=options.instrumented?globalThis.__decompression:null;
 }
 stats.total=performance.now()-start;stats.afterInit=memory(wasm);
 return {stats,tokenizer,wasm,kind,benchmark(text) {
  boundaries(text);const start=performance.now();const raw=tokenizer.tokenize(text);const rawMs=performance.now()-start;
  const adapterStart=performance.now();const safe=normalize(text,raw,kind);
  return {rawMs,adapterMs:rawMs+performance.now()-adapterStart,tokens:safe.length,memory:memory(wasm)};
 },analyze(text) {
  boundaries(text);const raw=tokenizer.tokenize(text);
  const normalized=normalize(text,raw,kind);
  return {raw,normalized,safe:normalized};
 }};
}
