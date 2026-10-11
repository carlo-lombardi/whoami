// Minimal static server for dist/, mounted under /whoami/ the way GitHub Pages serves it.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};
const port = Number(process.env.PORT) || 4173;
const base = '/whoami/';

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith(base)) {
    res.writeHead(302, { location: base }).end();
    return;
  }
  const relative = url.pathname.slice(base.length);
  const path = relative === '' ? 'index.html' : normalize(relative);
  if (path.startsWith('..')) {
    res.writeHead(400).end('bad request');
    return;
  }
  try {
    const body = await readFile(join('dist', path));
    res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
}).listen(port, () => console.log(`http://localhost:${port}${base}`));
