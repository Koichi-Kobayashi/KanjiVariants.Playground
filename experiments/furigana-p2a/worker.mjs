import {initialize,memory,resources} from './engines.mjs?p2a=2';
let initialization;
self.onmessage=async({data})=>{
 try {
  if(data.command==='init') {
   initialization??=initialize(data.kind,data.options).catch(e=>{initialization=null;throw e;});
   const engine=await initialization;
   self.postMessage({id:data.id,value:{stats:engine.stats,resources:resources()}});
  } else {
   const engine=await initialization;if(!engine)throw new Error('Not initialized');
   const start=performance.now();const value=data.command==='benchmark'?engine.benchmark(data.text):engine.analyze(data.text);
   self.postMessage({id:data.id,value:{...value,ms:performance.now()-start,memory:memory(engine.wasm)}});
  }
 }catch(error){self.postMessage({id:data.id,error:String(error)});}
};
