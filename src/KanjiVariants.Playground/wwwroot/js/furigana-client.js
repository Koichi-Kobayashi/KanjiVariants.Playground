// Lazy, reusable Worker bridge adapted from the P2a interop probe.
let worker, initialization, sequence=0;
const pending=new Map();
function reset(error=new Error('自動解析を終了しました。')) {
    worker?.terminate();worker=null;initialization=null;
    for(const request of pending.values()){clearTimeout(request.timer);request.reject(error);}
    pending.clear();
}
function request(command,extra={}) {
    return new Promise((resolve,reject)=>{
        const id=++sequence;
        const timer=setTimeout(()=>reset(new Error('自動解析がタイムアウトしました。再試行してください。')),120000);
        pending.set(id,{resolve,reject,timer});
        try {worker.postMessage({id,command,...extra});}catch(error){reset(error);}
    });
}
async function initialize() {
    if(!initialization) {
        worker=new Worker(new URL('./furigana-worker.js',import.meta.url),{type:'module'});
        worker.onmessage=({data})=>{
            const call=pending.get(data.id);if(!call)return;
            clearTimeout(call.timer);pending.delete(data.id);
            data.error?call.reject(new Error(data.error)):call.resolve(data.tokens);
        };
        worker.onerror=()=>reset(new Error('解析エンジンを起動できませんでした。再試行してください。'));
        initialization=request('init').catch(error=>{reset(error);throw error;});
    }
    return initialization;
}
export async function analyze(text) {
    await initialize();
    try {return await request('analyze',{text});}
    catch(error){reset(error);throw error;}
}
export function dispose(){reset();}
