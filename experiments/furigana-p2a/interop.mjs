// Minimal P2b-style lazy module -> worker bridge. This experiment is not used by P1.
const clients=new Map();
function create(kind){
 const worker=new Worker(new URL('./worker.mjs',import.meta.url),{type:'module'});
 const pending=new Map();let sequence=0,init,disposed=false;
 worker.onmessage=({data})=>{const entry=pending.get(data.id);if(!entry)return;pending.delete(data.id);clearTimeout(entry.timer);data.error?entry.reject(new Error(data.error)):entry.resolve(data.value);};
 worker.onerror=event=>{for(const entry of pending.values()){clearTimeout(entry.timer);entry.reject(new Error(event.message));}pending.clear();};
 function rpc(command,extra={}){if(disposed)return Promise.reject(new Error('cancelled'));return new Promise((resolve,reject)=>{const id=++sequence;const timer=setTimeout(()=>{pending.delete(id);reject(new Error('timeout'));},90000);pending.set(id,{resolve,reject,timer});worker.postMessage({id,command,...extra});});}
 return {async analyze(text){init??=rpc('init',{kind,options:{cache:'warm',compression:'gzip'}}).catch(error=>{init=null;throw error;});await init;return rpc('analyze',{text});},
  dispose(){disposed=true;worker.terminate();for(const entry of pending.values()){clearTimeout(entry.timer);entry.reject(new Error('cancelled'));}pending.clear();}};
}
export async function probe(kind,text){
 if(!clients.has(kind))clients.set(kind,create(kind));
 const client=clients.get(kind);
 const start=performance.now(),first=await client.analyze(text),second=await client.analyze(text);
 // Simulate input revision changing while a request is in flight. A stale result is dropped.
 let revision=1;const requestRevision=revision;const pending=client.analyze(text);revision=2;await pending;
 const staleDiscarded=requestRevision!==revision;
 const cancelled=client.analyze(text);client.dispose();clients.delete(kind);
 let cancellationObserved=false;try{await cancelled;}catch{cancellationObserved=true;}
 const retried=create(kind);const retry=await retried.analyze('今日');retried.dispose();
 const result={label:'interop-'+kind,kind,text,first,second,roundTripTotal:performance.now()-start,
   sameReadings:JSON.stringify(first.safe)===JSON.stringify(second.safe),staleDiscarded,cancellationObserved,
   retrySucceeded:retry.safe.every(t=>t.valid),subpath:location.pathname};
 await fetch(new URL('./save',import.meta.url),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(result)});
 return JSON.stringify({kind,text,tokens:first.safe.map(t=>`${t.surface}[${t.reading??'∅'}] [${t.start},${t.end})`),
   sameReadings:result.sameReadings,staleDiscarded,cancellationObserved,retrySucceeded:result.retrySucceeded},null,2);
}
