import {initialize,memory,resources,boundaries} from './engines.mjs?p2a=2';
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
const hira=text=>text.replace(/[ァ-ヶ]/g,ch=>String.fromCharCode(ch.charCodeAt(0)-0x60));
const params=new URLSearchParams(location.search);
const options={cache:params.get('cache')??'cold',compression:params.get('compression')??'gzip',run:params.get('run')??crypto.randomUUID(),instrumented:params.get('instrumented')==='true'};
const kind=params.get('engine')??'lindera',mode=params.get('mode')??'main';
const beforeClickVendorRequests=resources().filter(x=>x.url.includes('/vendor/')).length;
document.querySelector('#lazy').textContent=`クリック前のエンジン・辞書取得件数: ${beforeClickVendorRequests}`;
let initPromise,worker,seq=0;const pending=new Map();
function rpc(command,extra={}) {
 return new Promise((resolve,reject)=>{
  const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(new Error('Worker timeout'));},90000);
  pending.set(id,{resolve,reject,timer});worker.postMessage({id,command,...extra});
 });
}
async function getEngine() {
 if(!initPromise)initPromise=(async()=>{
  if(mode==='worker') {
   worker=new Worker(new URL('./worker.mjs',import.meta.url),{type:'module'});
   worker.onmessage=({data})=>{const p=pending.get(data.id);if(!p)return;clearTimeout(p.timer);pending.delete(data.id);data.error?p.reject(new Error(data.error)):p.resolve(data.value);};
   worker.onerror=e=>{for(const p of pending.values()){clearTimeout(p.timer);p.reject(new Error(e.message));}pending.clear();};
   return {init:await rpc('init',{kind,options}),analyze:async text=>rpc('analyze',{text}),benchmark:async text=>rpc('benchmark',{text}),getMemory:()=>null};
  }
  const engine=await initialize(kind,options);
  return {init:{stats:engine.stats},getMemory:()=>memory(engine.wasm),benchmark:async text=>engine.benchmark(text),analyze:async text=>{const t=performance.now();return {...engine.analyze(text),ms:performance.now()-t};},engine};
 })().catch(error=>{initPromise=null;worker?.terminate();throw error;});
 return initPromise;
}
function safeRuby(tokens,diagnosis) {
 const boundaries=new Set([0,...diagnosis.items.map(x=>x.utf16Index+x.utf16Length)]);
 return tokens.map(t=>{
  const unitAligned=boundaries.has(t.start)&&boundaries.has(t.end);
  const hits=diagnosis.unlearnedItems.filter(x=>x.utf16Index>=t.start&&x.utf16Index+x.utf16Length<=t.end);
  const canRead=t.reading&&t.reading!=='*'&&!t.unknown;
  return {surface:t.surface,start:t.start,end:t.end,unlearned:hits.length,unitAligned,
    status:!t.valid||!unitAligned?'position-rejected':hits.length===0?'learned-or-nonkanji':canRead?'whole-word-candidate':'review',
    reading:canRead?hira(t.reading):null};
 });
}
export async function run() {
 const cases=await (await fetch(new URL('./cases.json',import.meta.url))).json();
 const education=await (await fetch(new URL('./generated/education.json',import.meta.url))).json();
 performance.clearResourceTimings();
 const result={label:`${kind}-${mode}-${options.cache}-${options.compression}-${options.run}${options.instrumented?'-instrumented':''}`,kind,mode,options,beforeClickVendorRequests,
  environment:{userAgent:navigator.userAgent,cores:navigator.hardwareConcurrency,deviceMemory:navigator.deviceMemory,secure:isSecureContext,crossOriginIsolated,
  userAgentMemoryAvailable:typeof performance.measureUserAgentSpecificMemory==='function'},before:memory(),cases:[],benchmarks:[],longTasks:[]};
 let observer;try{observer=new PerformanceObserver(list=>result.longTasks.push(...list.getEntries().map(e=>({ms:e.duration,start:e.startTime}))));observer.observe({type:'longtask',buffered:false});}catch{}
 const initStart=performance.now();const loaded=await getEngine();result.initializationWall=performance.now()-initStart;result.init=loaded.init;
 result.firstParse=await loaded.benchmark('今日');result.secondParse=await loaded.benchmark('今日');
 for(const item of cases) {
  const entry={...item};
  try {
   const analyzed=await loaded.analyze(item.text);
   Object.assign(entry,analyzed);
   entry.actual=hira(analyzed.safe.map(t=>t.reading&&t.reading!=='*'?t.reading:t.surface).join(''));
   entry.evaluation=!item.expected?'diagnostic-only':item.expected.includes(entry.actual)?'expected':item.alternate?.includes(entry.actual)?'allowed-alternate':analyzed.safe.some(t=>t.unknown&&(!t.reading||t.reading==='*'))?'missing-or-unknown':'wrong-reading';
   entry.rawPositionFailures=analyzed.normalized.filter(t=>!t.valid).length;
   entry.safePositionFailures=analyzed.safe.filter(t=>!t.valid).length;
   entry.rubyByGrade=education[item.id].map(d=>({grade:d.targetGrade,candidates:safeRuby(analyzed.safe,d)}));
  }catch(error){entry.error=String(error);entry.evaluation=item.id.startsWith('invalid-')?'invalid-utf16-rejected':'execution-failed';}
  result.cases.push(entry);
 }
 const seed='今日は図書館で大人と宇宙の本を読みます。';
 for(const length of [seed.length,500,2000]) {
  const text=seed.repeat(Math.ceil(length/seed.length)).slice(0,length);
  const first=await loaded.benchmark(text), times=[],nativeTimes=[],adapterTimes=[];
  for(let i=0;i<11;i++) {
   const t=performance.now();const response=await loaded.benchmark(text);times.push(performance.now()-t);nativeTimes.push(response.rawMs);adapterTimes.push(response.adapterMs);
  }
  result.benchmarks.push({length,first:first.rawMs,median:median(nativeTimes),medianAdapter:median(adapterTimes),medianRoundTrip:median(times),nativeTimes,adapterTimes,times,memory:loaded.getMemory(),workerMemory:first.memory??null});
 }
 result.after=loaded.getMemory();result.resources=resources();
 const savedInit=initPromise;await getEngine();
 result.safety={tamperedPositionRejected:safeRuby([{start:1,end:2,surface:'偽',valid:false,reading:'ギ',unknown:false}],education.today[0])[0].status==='position-rejected',
  repeatedInitializationSamePromise:savedInit===initPromise};
 await new Promise(resolve=>setTimeout(resolve,60));observer?.disconnect();
 await fetch(new URL('./save',import.meta.url),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(result)});
 document.querySelector('#status').textContent=`完了: ${kind} / ${mode} / ${options.cache}`;
 document.querySelector('#output').textContent=JSON.stringify({init:result.init,benchmarks:result.benchmarks,cases:result.cases.map(x=>({id:x.id,actual:x.actual,evaluation:x.evaluation,rawPositionFailures:x.rawPositionFailures,safePositionFailures:x.safePositionFailures,error:x.error}))},null,2);
 parent.postMessage({type:'p2a-result',result},location.origin);
 return result;
}
document.querySelector('#run').onclick=()=>run().catch(error=>{
 document.querySelector('#status').textContent=String(error);parent.postMessage({type:'p2a-error',error:String(error)},location.origin);
});
if(params.get('auto')==='true')document.querySelector('#run').click();
