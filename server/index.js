// Server HTTP (file statis) + WebSocket (room real-time). Tanpa framework.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Hub } from './hub.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATIC_DIRS = { '/shared/': path.join(ROOT, 'shared'), '/': path.join(ROOT, 'client') };

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
};

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self' ws: wss:",
  "frame-ancestors 'none'",
  "base-uri 'none'",
].join('; ');

function resolveStatic(urlPath) {
  let rel;
  let base;
  if (urlPath.startsWith('/shared/')) {
    base = STATIC_DIRS['/shared/'];
    rel = urlPath.slice('/shared/'.length);
  } else {
    base = STATIC_DIRS['/'];
    rel = urlPath.slice(1);
  }
  const full = path.resolve(base, decodeURIComponent(rel));
  if (full !== base && !full.startsWith(base + path.sep)) return null; // cegah path traversal
  return full;
}

export function createServer({ trustProxy = false } = {}) {
  const hub = new Hub({
    trustProxy,
    allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
  });

  const server = http.createServer((req, res) => {
    const headers = {
      'Content-Security-Policy': CSP,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'X-Frame-Options': 'DENY',
    };
    let urlPath;
    try {
      urlPath = new URL(req.url, 'http://x').pathname;
    } catch {
      res.writeHead(400, headers).end('Bad request');
      return;
    }
    if (urlPath === '/healthz') {
      res.writeHead(200, { ...headers, 'Content-Type': 'text/plain' }).end('ok');
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, headers).end('Method not allowed');
      return;
    }
    let file = resolveStatic(urlPath === '/' ? '/index.html' : urlPath);
    const serve = (f) => {
      const ext = path.extname(f).toLowerCase();
      res.writeHead(200, { ...headers, 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=300' });
      if (req.method === 'HEAD') return res.end();
      const rs = fs.createReadStream(f);
      rs.on('error', () => res.destroy());
      rs.pipe(res);
    };
    if (file && fs.existsSync(file) && fs.statSync(file).isFile()) return serve(file);
    // Tautan room seperti /r/KMPL-48 atau path tanpa ekstensi jatuh ke halaman utama.
    const index = path.join(ROOT, 'client', 'index.html');
    if (!path.extname(urlPath) && fs.existsSync(index)) return serve(index);
    res.writeHead(404, headers).end('Tidak ditemukan');
  });

  hub.attach(server);
  return { server, hub };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || '0.0.0.0';
  const { server } = createServer({ trustProxy: process.env.TRUST_PROXY === '1' });
  server.listen(port, host, () => console.log(`Friend Zone berjalan di http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`));
}
