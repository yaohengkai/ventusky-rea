const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36';

export async function upstreamFetch(url, { timeout = 25000, headers = {}, method = 'GET', body } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      method,
      body,
      signal: ctrl.signal,
      headers: {
        'user-agent': UA,
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'referer': 'https://www.ventusky.com/',
        ...headers,
      },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchText(url, opts) {
  const res = await upstreamFetch(url, opts);
  if (!res.ok) throw new Error(`Upstream ${res.status} for ${url}`);
  return res.text();
}

export async function fetchJson(url, opts) {
  const text = await fetchText(url, opts);
  return JSON.parse(text);
}

export async function fetchBuffer(url, opts) {
  const res = await upstreamFetch(url, opts);
  if (!res.ok) throw new Error(`Upstream ${res.status} for ${url}`);
  const type = res.headers.get('content-type') || 'application/octet-stream';
  const buf = Buffer.from(await res.arrayBuffer());
  return { buf, type, status: res.status, headers: res.headers };
}

export function decodeHtml(s) {
  if (!s) return s;
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}
