import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const files=(await fs.readdir(path.join(root,'results'))).filter(n=>n.endsWith('.json'));
const runs=await Promise.all(files.map(async name=>JSON.parse(await fs.readFile(path.join(root,'results',name),'utf8'))));
const med=a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)];
const round=x=>x==null?null:Math.round(x*100)/100;
const assets=JSON.parse(await fs.readFile(path.join(root,'generated/assets.json'),'utf8'));
const summary={environment:runs.find(x=>x.environment)?.environment,groups:[],sizes:{},cases:[],interop:runs.filter(x=>x.label?.startsWith('interop-'))};
for(const kind of ['lindera','kuromoji']) {
 const relevant=assets.filter(x=>kind==='lindera'?(x.path.startsWith('vendor/ipadic/')||x.path.startsWith('vendor/lindera/')):x.path.startsWith('vendor/kuromoji/'));
 summary.sizes[kind]={raw:relevant.reduce((s,x)=>s+x.expandedBytes,0),servedFiles:relevant.reduce((s,x)=>s+x.bytes,0),gzip:relevant.reduce((s,x)=>s+x.gzipBytes,0),brotli:relevant.some(x=>x.brotliBytes===null)?null:relevant.reduce((s,x)=>s+x.brotliBytes,0),assets:relevant};
 for(const mode of ['main','worker'])for(const cache of ['cold','warm']) {
  const group=runs.filter(x=>x.kind===kind&&x.mode===mode&&x.options?.cache===cache&&x.options?.compression==='gzip'&&!x.options.instrumented);
  if(!group.length)continue;
  const network=group.map(x=>(x.init.resources??x.resources).filter(e=>e.url.includes('/vendor/')));
  const metrics={kind,mode,cache,n:group.length,init:round(med(group.map(x=>x.init.stats.total))),
   initWall:round(med(group.map(x=>x.initializationWall))),initRange:group.map(x=>round(x.init.stats.total)),
   firstParse:round(med(group.map(x=>x.firstParse.rawMs))),secondParse:round(med(group.map(x=>x.secondParse.rawMs))),
   transfer:med(network.map(a=>a.reduce((s,x)=>s+x.transfer,0))),encoded:med(network.map(a=>a.reduce((s,x)=>s+x.encoded,0))),
   phases:{},benchmarks:[],longTaskMax:round(med(group.map(x=>Math.max(0,...x.longTasks.map(t=>t.ms))))),
   memory:{before:group.map(x=>x.init.stats.before),init:group.map(x=>x.init.stats.afterInit),after:group.map(x=>x.after)}};
  for(const name of ['jsLoad','wasmFetch','wasmInit','dictionaryFetch','dictionaryInit','dictionaryFetchAndInit']) {
   const values=group.map(x=>x.init.stats[name]).filter(x=>x!=null);if(values.length)metrics.phases[name]=round(med(values));
  }
  for(const length of [20,500,2000]) {
   const points=group.map(x=>x.benchmarks.find(b=>b.length===length));
   metrics.benchmarks.push({length,nativeMedian:round(med(points.flatMap(p=>p.nativeTimes))),
    adapterMedian:round(med(points.flatMap(p=>p.adapterTimes))),endToEndMedian:round(med(points.flatMap(p=>p.times))),workerMemory:points[0].workerMemory});
  }
  summary.groups.push(metrics);
 }
 const representative=runs.find(x=>x.label===`${kind}-main-cold-gzip-0`);
 summary.cases.push({kind,cases:representative.cases.map(x=>({id:x.id,text:x.text,actual:x.actual,evaluation:x.evaluation,
   rawPositionFailures:x.rawPositionFailures,safePositionFailures:x.safePositionFailures,error:x.error,
   tokens:x.safe?.map(t=>({surface:t.surface,reading:t.reading,pos:t.pos,base:t.base,unknown:t.unknown,start:t.start,end:t.end,valid:t.valid})),
   rubyByGrade:x.rubyByGrade}))});
}
summary.instrumented=runs.filter(x=>x.options?.instrumented).map(x=>({label:x.label,decompressionSum:x.init.stats.decompression.reduce((s,x)=>s+x.ms,0),expanded:x.init.stats.decompression.reduce((s,x)=>s+x.bytes,0),init:x.init.stats.total}));
summary.rawTransfers=runs.filter(x=>x.options?.compression==='raw').map(x=>({kind:x.kind,transfer:x.resources.filter(e=>e.url.includes('/vendor/')).reduce((s,x)=>s+x.transfer,0),init:x.init.stats.total}));
await fs.writeFile(path.join(root,'results/summary.json'),JSON.stringify(summary,null,2));
const hira=t=>t?.replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-96));
const escape=s=>String(s??'').replaceAll('|','\\|').replaceAll('\r','\\r').replaceAll('\n','\\n').replaceAll('\t','\\t');
let tables='# 実ブラウザ測定表\n\nこの表はresults/の最終測定からsummarize.mjsで生成。採用判断と測定の限界はREPORT.md参照。\n\n';
tables+='## 初期化・解析（ms）\n\n| エンジン | 場所 | cache | n | 初期化中央値 | 今日の初回 | 今日の2回目 | 20単位 | 500単位 | 2,000単位 | 実転送bytes |\n|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|\n';
for(const g of summary.groups)tables+=`| ${g.kind} | ${g.mode} | ${g.cache} | ${g.n} | ${g.init} | ${g.firstParse} | ${g.secondParse} | ${g.benchmarks.map(x=>x.nativeMedian).join(' | ')} | ${g.transfer} |\n`;
tables+='\n## 実際のトークンと読み\n\n「∅」は読み未取得。「?」は未知語。*はエンジンが返した未定義値。位置はUTF-16、半開区間。空白等の省略は原文の再構成に使わない。\n\n';
for(const row of summary.cases) {
 tables+=`### ${row.kind}\n\n| 入力 | トークン［読み］ | 評価 | 位置不一致数（raw / adapter） |\n|---|---|---|---|\n`;
 for(const c of row.cases)tables+=`| ${escape(c.text)} | ${escape(c.tokens?.map(t=>`${t.surface}[${hira(t.reading)||'∅'}]${t.unknown?'?':''}`).join(' / ')??c.error)} | ${c.evaluation} | ${c.rawPositionFailures??'—'} / ${c.safePositionFailures??'—'} |\n`;
 tables+='\n';
}
tables+='## 品詞・未知語・UTF-16位置・辞書形\n\n';
for(const row of summary.cases) {
 tables+=`### ${row.kind}\n\n| 例ID | 表層 | 読み | 品詞 | 未知語 | UTF-16範囲 | 辞書形 |\n|---|---|---|---|---|---|---|\n`;
 for(const c of row.cases)for(const t of c.tokens??[])tables+=`| ${c.id} | ${escape(t.surface)} | ${escape(t.reading??'∅')} | ${escape(t.pos.join(','))} | ${t.unknown} | [${t.start},${t.end}) | ${escape(t.base)} |\n`;
}
tables+='\n## 実行配布物のSHA-256\n\n| ファイル | bytes | SHA-256 |\n|---|---:|---|\n';
for(const asset of assets)tables+=`| ${asset.path} | ${asset.bytes} | ${asset.sha256} |\n`;
await fs.writeFile(path.join(root,'MEASUREMENTS.md'),tables);
console.log(JSON.stringify({groups:summary.groups.map(({memory,...g})=>g),sizes:Object.fromEntries(Object.entries(summary.sizes).map(([k,{assets,...v}])=>[k,v])),instrumented:summary.instrumented,rawTransfers:summary.rawTransfers},null,2));
