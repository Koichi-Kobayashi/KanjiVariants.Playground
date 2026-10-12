// Lindera 6.2.0 / IPADIC format 2. All URLs stay under the module's application subpath.
let enginePromise;
const base=new URL('../furigana/lindera-6.2.0/',import.meta.url);
async function checkedFetch(asset) {
    const response=await fetch(new URL(asset.file,base));
    if(!response.ok)throw new Error('辞書・エンジンのファイルを取得できませんでした。');
    const bytes=await response.arrayBuffer();
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
    if(hash!==asset.sha256)throw new Error('辞書・エンジンの検証に失敗しました。キャッシュを更新して再試行してください。');
    if(!asset.gzip)return new Uint8Array(bytes);
    if(typeof DecompressionStream==='undefined')throw new Error('このブラウザは辞書の展開に対応していません。手動編集をご利用ください。');
    return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
}
async function initialize() {
    const response=await fetch(new URL('manifest.json',base));
    if(!response.ok)throw new Error('辞書の構成情報を取得できませんでした。');
    const manifest=await response.json();
    if(manifest.buildOrigin!=='self-built'||manifest.wasm?.sha256!=='fbe6bf9a280f10f7e897fb88d997838c6c1bf1df20bf288ea3df23962a1897ba')
        throw new Error('採用済みエンジンの構成情報ではありません。キャッシュを更新して再試行してください。');
    const module=await import(new URL('lindera_wasm.js',base));
    await module.default({module_or_path:await checkedFetch(manifest.wasm)});
    let arrays=await Promise.all(manifest.dictionary.map(checkedFetch));
    const dictionary=module.loadDictionaryFromBytes(...arrays);
    // Constructor consumes the Dictionary; do not free it a second time.
    const tokenizer=new module.Tokenizer(dictionary,'normal');arrays=null;
    return tokenizer;
}
function normalize(text,raw) {
    const bytesToUtf16=new Map([[0,0]]),encoder=new TextEncoder();let bytes=0,units=0;
    for(const ch of text) {
        const cp=ch.codePointAt(0);
        if(cp>=0xd800&&cp<=0xdfff)throw new Error('不正UTF-16のため解析できません。');
        units+=ch.length;bytes+=encoder.encode(ch).length;bytesToUtf16.set(bytes,units);
    }
    let previousEnd=0;
    return raw.map(token=>{
        const start=bytesToUtf16.get(token.byteStart),end=bytesToUtf16.get(token.byteEnd);
        const valid=Number.isInteger(start)&&Number.isInteger(end)&&end>start&&start>=previousEnd&&end<=text.length&&text.slice(start,end)===token.surface;
        if(valid)previousEnd=end;
        return {start:start??-1,end:end??-1,surface:token.surface,reading:token.details?.[7]??null,
            unknown:token.isUnknown,valid,pos:token.details?.slice(0,4)??[]};
    });
}
self.onmessage=async({data})=>{
    try {
        enginePromise??=initialize().catch(error=>{enginePromise=null;throw error;});
        const tokenizer=await enginePromise;
        let tokens=[];
        if(data.command==='analyze') {
            if(typeof data.text!=='string'||data.text.length>2000)throw new Error('入力は2,000 UTF-16単位以内にしてください。');
            // Reject invalid source before Rust's string conversion can replace surrogates.
            normalize(data.text,[]);
            tokens=normalize(data.text,tokenizer.tokenize(data.text));
        }
        self.postMessage({id:data.id,tokens});
    }catch(error){self.postMessage({id:data.id,error:String(error.message??error)});}
};
