// Local static server for the survival preview. Serves preview/ and maps
// /engine/* to the unchanged candidate source in candidate/hazards-v3/src.
// The page file has no <!doctype>/<head> (the artifact host adds them), so add a
// matching skeleton here. Usage: node preview/serve.mjs [port]
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const engine = path.resolve(here, '..', 'candidate', 'hazards-v3', 'src');
const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript'};
const skeleton = body => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>${body}</body></html>`;

export function startServer(port = 0) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let file;
    if (url.pathname === '/' || url.pathname === '/index.html') file = path.join(here, 'index.html');
    else if (url.pathname === '/app.js') file = path.join(here, 'app.js');
    else if (/^\/engine\/[a-z-]+\.mjs$/.test(url.pathname)) file = path.join(engine, path.basename(url.pathname));
    if (!file) { res.writeHead(404).end('not found'); return; }
    try {
      let body = await readFile(file, 'utf8');
      if (file.endsWith('.html')) body = skeleton(body);
      res.writeHead(200, {'content-type': types[path.extname(file)], 'cache-control': 'no-store'}).end(body);
    } catch { res.writeHead(404).end('not found'); }
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = await startServer(Number(process.argv[2] || 8080));
  console.log(`Survival preview: http://127.0.0.1:${server.address().port}/`);
}
