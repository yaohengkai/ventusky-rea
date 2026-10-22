/**
 * Netlify Function: catch-all proxy.
 *
 * Port of proxy() from ventusky-local/server.mjs to the Web Fetch API:
 *  - /              -> https://www.ventusky.com/...
 *  - /proxy/<host>/ -> https://<host>/...   (only the allow-listed hosts)
 *
 * HTML/CSS/JS bodies are rewritten so the original frontend keeps working
 * behind a single origin, exactly like the local server does.
 */
import { rewriteVentuskyUrls, rewriteLocation, sanitizeSetCookie } from '../../ventusky-local/lib/rewrite.mjs';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36';
const ALLOWED_HOSTS = new Set([
  'www.ventusky.com', 'static.ventusky.com', 'data.ventusky.com',
  'archive.ventusky.com', 'map.ventusky.com', 'webcams.ventusky.com',
  'my.ventusky.com', 'users.ventusky.com', 'api.ventusky.com',
  'embed.ventusky.com', 'strikes.ventusky.com',
]);
const REWRITE_TYPES = /^(text\/html|text\/css|application\/javascript|text\/javascript|application\/x-javascript)/i;
const DROP_HEADERS = new Set([
  'content-encoding', 'content-length', 'transfer-encoding', 'connection',
  'content-security-policy', 'content-security-policy-report-only',
  'strict-transport-security', 'alt-svc', 'nel', 'report-to', 'set-cookie',
]);

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

// The hostname(s) the browser is actually using (*.netlify.app, a custom
// domain, localhost under `netlify dev`, ...). The rewritten frontend only
// runs when location.hostname is in its allow-list; otherwise it navigates to
// https://www.ventusky.com/ — which this proxy turns into "/" — so the page
// would reload itself forever. Collect every plausible source because a
// rewrite can leave the request URL and the proxy headers out of sync.
function requestHostnames(request, url) {
  const hosts = new Set();
  for (const raw of [
    request.headers.get('x-forwarded-host'),
    request.headers.get('host'),
    url.hostname,
  ]) {
    if (!raw) continue;
    for (const part of raw.split(',')) {
      const host = part.trim().replace(/:\d+$/, '').toLowerCase();
      if (host) hosts.add(host);
    }
  }
  return [...hosts];
}

function fail(status, message) {
  return new Response(message, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export default async (request) => {
  const url = new URL(request.url);
  const target = targetFor(url);
  if (!target) return fail(400, 'Unknown proxy target');

  const method = request.method;
  const headers = {
    'user-agent': request.headers.get('user-agent') || UA,
    'accept': request.headers.get('accept') || '*/*',
    'accept-language': request.headers.get('accept-language') || 'en-US,en;q=0.9',
    'accept-encoding': 'identity',
    'referer': request.headers.get('referer') || 'https://www.ventusky.com/',
  };
  for (const name of ['cookie', 'content-type', 'range']) {
    const value = request.headers.get(name);
    if (value) headers[name] = value;
  }

  const init = { method, headers, redirect: 'manual' };
  if (method !== 'GET' && method !== 'HEAD' && request.body) {
    init.body = request.body;
    init.duplex = 'half';
  }

  let upstream;
  try {
    upstream = await fetch(target, init);
  } catch (err) {
    return fail(502, `Upstream fetch failed: ${err.message}`);
  }

  const type = upstream.headers.get('content-type') || '';
  const isText = REWRITE_TYPES.test(type);
  const out = new Headers();
  for (const [k, v] of upstream.headers) {
    const name = k.toLowerCase();
    if (DROP_HEADERS.has(name)) continue;
    if (name === 'location') { out.set('location', rewriteLocation(v)); continue; }
    if (name === 'cache-control' && isText) { out.set(name, 'no-cache'); continue; }
    out.append(k, v);
  }
  const cookies = upstream.headers.getSetCookie?.() || [];
  for (const cookie of cookies) out.append('set-cookie', sanitizeSetCookie(cookie));

  if (isText) {
    const text = rewriteVentuskyUrls(await upstream.text(), requestHostnames(request, url));
    const body = method === 'HEAD' ? null : Buffer.from(text, 'utf8');
    if (body) out.set('content-length', String(body.length));
    return new Response(body, { status: upstream.status, headers: out });
  }

  const body = method === 'HEAD' ? null : Buffer.from(await upstream.arrayBuffer());
  if (body) out.set('content-length', String(body.length));
  return new Response(body, { status: upstream.status, headers: out });
};
