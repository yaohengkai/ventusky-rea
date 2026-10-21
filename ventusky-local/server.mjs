#!/usr/bin/env node
/**
 * Ventusky Local — a personal-study reverse-proxy for the public Ventusky site
 * plus a documented data API. It is not affiliated with Ventusky.
 *
 * Usage: node server.mjs [--port 8787] [--host 127.0.0.1]
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { rewriteVentuskyUrls, rewriteLocation, sanitizeSetCookie } from './lib/rewrite.mjs';
import { handleApi } from './lib/api.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
}
const PORT = Number(arg('--port', process.env.PORT || 8787));
const HOST = arg('--host', process.env.HOST || '127.0.0.1');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36';
const ALLOWED_HOSTS = new Set([
  'www.ventusky.com', 'static.ventusky.com', 'data.ventusky.com',
  'archive.ventusky.com', 'map.ventusky.com', 'webcams.ventusky.com',
  'my.ventusky.com', 'users.ventusky.com', 'api.ventusky.com',
  'embed.ventusky.com', 'strikes.ventusky.com',
]);
const REWRITE_TYPES = /^(text\/html|text\/css|application\/javascript|text\/javascript|application\/x-javascript)/i;

const stats = { requests: 0, proxied: 0, errors: 0, startedAt: new Date().toISOString() };

function targetFor(url) {
  if (url.pathname.startsWith('/proxy/')) {
    const rest = url.pathname.slice('/proxy/'.length);
    const slash = rest.indexOf('/');
    const host = (slash === -1 ? rest : rest.slice(0, slash)).toLowerCase();
    if (!ALLOWED_HOSTS.has(host)) return null;
    const path = slash === -1 ? '/' : rest.slice(slash);
    return `https://${host}${path}${url.search}`;
  }
  return `https://www.ventusky.com${url.pathname}${url.search}`;
}

async function readBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function proxy(req, res, url) {
  const target = targetFor(url);
  if (!target) {
    res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
    return res.end('Unknown proxy target');
  }
  const headers = {
    'user-agent': req.headers['user-agent'] || UA,
    'accept': req.headers['accept'] || '*/*',
    'accept-language': req.headers['accept-language'] || 'en-US,en;q=0.9',
    'accept-encoding': 'identity',
    'referer': req.headers['referer'] || 'https://www.ventusky.com/',
  };
  if (req.headers.cookie) headers.cookie = req.headers.cookie;
  if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];
  if (req.headers.range) headers.range = req.headers.range;
  const body = await readBody(req);
  let upstream;
  try {
    upstream = await fetch(target, { method: req.method, headers, body, redirect: 'manual' });
  } catch (err) {
    stats.errors++;
    res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
    return res.end(`Upstream fetch failed: ${err.message}`);
  }
  stats.proxied++;
  const t0 = Date.now();

  const type = upstream.headers.get('content-type') || '';
  const isText = REWRITE_TYPES.test(type);
  const outHeaders = {};
  for (const [k, v] of upstream.headers) {
    if (['content-encoding', 'content-length', 'transfer-encoding', 'connection',
         'content-security-policy', 'content-security-policy-report-only',
         'strict-transport-security', 'alt-svc', 'nel', 'report-to'].includes(k)) continue;
    if (k === 'set-cookie') continue;
    if (k === 'location') { outHeaders.location = rewriteLocation(v); continue; }
    if (k === 'cache-control' && isText) { outHeaders[k] = 'no-cache'; continue; }
    outHeaders[k] = v;
  }
  const cookies = upstream.headers.getSetCookie?.() || [];
  if (cookies.length) outHeaders['set-cookie'] = cookies.map(sanitizeSetCookie);

  if (isText) {
    let text = await upstream.text();
    text = rewriteVentuskyUrls(text);
    const buf = Buffer.from(text, 'utf8');
    outHeaders['content-length'] = String(buf.length);
    res.writeHead(upstream.status, outHeaders);
    if (req.method === 'HEAD') return res.end();
    return res.end(buf);
  }

  if (upstream.status >= 400 || process.env.DEBUG_PROXY === '1') {
    console.log(`[proxy] ${req.method} ${upstream.status} ${Date.now()-t0}ms ${target.slice(0,160)}`);
  }

  // Binary: stream through unchanged (images, fonts, video).
  res.writeHead(upstream.status, outHeaders);
  if (req.method === 'HEAD' || !upstream.body) return res.end();
  Readable.fromWeb(upstream.body).pipe(res);
}

const server = http.createServer(async (req, res) => {
  stats.requests++;
  const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
  try {
    if (url.pathname === '/__health') {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ ok: true, ...stats, uptime: process.uptime() }, null, 2));
    }
    if (url.pathname.startsWith('/__api/') || url.pathname === '/__api') {
      return await handleApi(req, res, url);
    }
    if (url.pathname === '/__lab' || url.pathname === '/__lab/') {
      const body = fs.readFileSync(path.join(__dirname, 'public', 'lab.html'));
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-length': String(body.length) });
      return res.end(body);
    }
    if (url.pathname === '/__docs' || url.pathname === '/__docs/') {
      res.writeHead(302, { location: '/__docs/API.md' });
      return res.end();
    }
    if (url.pathname.startsWith('/__docs/')) {
      const rel = decodeURIComponent(url.pathname.slice('/__docs/'.length));
      const docsDir = path.join(__dirname, 'docs');
      const file = path.resolve(docsDir, rel);
      if (!file.startsWith(docsDir + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        return res.end('docs file not found');
      }
      const ext = path.extname(file).toLowerCase();
      const type = ext === '.md' ? 'text/markdown; charset=utf-8' : ext === '.json' ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8';
      const body = fs.readFileSync(file);
      res.writeHead(200, { 'content-type': type, 'content-length': String(body.length) });
      return res.end(body);
    }
    return await proxy(req, res, url);
  } catch (err) {
    stats.errors++;
    console.error('[error]', req.method, req.url, err);
    if (!res.headersSent) {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    }
    res.end(`Local proxy error: ${err.message}`);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Ventusky Local running at http://${HOST}:${PORT}/`);
  console.log(`API catalog:  http://${HOST}:${PORT}/__api/catalog`);
  console.log(`Health:       http://${HOST}:${PORT}/__health`);
});
