// 公開物のサブパス検証専用。アプリの診断処理は一切持たないローカル静的サーバー。
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(process.argv[2] || 'artifacts/publish/wwwroot');
const base = '/KanjiVariants.Playground/';
const port=Number(process.argv[3]??5175);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid local server port');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm', '.txt': 'text/plain; charset=utf-8' };
http.createServer((req, res) => {
    try {
        const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
        if (process.env.PAGES_LOG_REQUESTS === '1') console.log(pathname);
        if (pathname === base.slice(0, -1)) { res.writeHead(301, { Location: base }); res.end(); return; }
        if (!pathname.startsWith(base)) { res.writeHead(404); res.end(); return; }
        const file = path.resolve(root, pathname.slice(base.length) || 'index.html');
        const relative = path.relative(root, file);
        if (relative.startsWith('..') || path.isAbsolute(relative) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
            res.writeHead(404); res.end(); return;
        }
        // 圧縮交渉をしない。GitHub Pagesが.brを配信するという仮定を置かず検証する。
        res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        fs.createReadStream(file).pipe(res);
    } catch { res.writeHead(400); res.end(); }
}).listen(port, '127.0.0.1', () => console.log(`http://localhost:${port}/KanjiVariants.Playground/`));
