import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { build, out } from './build.mjs';

await build();
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const name = decodeURIComponent(url.pathname);
    if (name === '/zh') { res.writeHead(308, { Location: '/zh/' }); res.end(); return; }
    const relative = name === '/' ? 'index.html' : name === '/zh/' ? 'zh/index.html' : name.slice(1);
    const target = path.resolve(out, relative);
    if (!target.startsWith(out + path.sep)) { res.writeHead(403); res.end(); return; }
    const data = await readFile(target);
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(await readFile(path.join(out, '404.html')));
  }
});
server.listen(3000, '127.0.0.1', () => console.log('Local: http://localhost:3000 (Ctrl+C to stop)'));
