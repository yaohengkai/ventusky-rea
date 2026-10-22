// Rewrites Ventusky absolute URLs so the original frontend can run behind
// a single local origin. This is a local-study proxy; it does not modify
// the application logic.
const NON_WWW_HOST = /(https?:)?\/\/([a-z0-9.-]+\.ventusky\.com)(?=[/'"\s)<]|$)/gi;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// The hostname is injected into a JavaScript regex literal inside the served
// bundle, so only accept a plain DNS name / IPv4 / bracketed IPv6. Anything
// else (a forged Host header, for instance) is ignored.
function safeHostname(value) {
  if (!value) return '';
  const host = String(value).toLowerCase();
  if (/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(host)) return host;
  if (/^\[[0-9a-f:.]+\]$/.test(host)) return host;
  return '';
}

// `hostname` may be a single name or a list of candidates (the URL host and
// proxy headers can disagree under a rewrite).
export function rewriteVentuskyUrls(text, hostname = '') {
  if (!text) return text;
  // www is served at the local root so that path-based routing keeps working.
  text = text.replace(/https?:\/\/www\.ventusky\.com\/*/gi, '/');
  text = text.replace(/\/\/www\.ventusky\.com\/*/gi, '/');
  // The original bundle only runs when location.hostname matches
  // *.ventusky.com or the exact hostname `localhost`. On any other host it
  // calls window.open("https://www.ventusky.com/", "_top") — and since the
  // line above rewrites that URL to "/", an unlisted deployment host (e.g.
  // *.netlify.app) reloads itself forever and the no-JS fallback stays on
  // screen. Allow the loopback IP and the host that served this response.
  const allowed = new Set(['localhost', '127\\.0\\.0\\.1']);
  for (const candidate of Array.isArray(hostname) ? hostname : [hostname]) {
    const host = safeHostname(candidate);
    if (host) allowed.add(escapeRegExp(host));
  }
  text = text.replace('|^localhost$', () => `|^(${[...allowed].join('|')})$`);
  return text.replace(NON_WWW_HOST, (match, scheme, host) => {
    host = host.toLowerCase();
    if (host === 'www.ventusky.com') return match;
    return `/proxy/${host}`;
  });
}

export function rewriteLocation(location) {
  if (!location) return location;
  try {
    const u = new URL(location, 'https://www.ventusky.com/');
    if (!u.hostname.endsWith('ventusky.com')) return location;
    if (u.hostname === 'www.ventusky.com') {
      return `${u.pathname}${u.search}${u.hash}`;
    }
    return `/proxy/${u.hostname}${u.pathname}${u.search}${u.hash}`;
  } catch {
    return location;
  }
}

export function sanitizeSetCookie(cookie) {
  return cookie
    .replace(/;\s*domain=[^;]+/gi, '')
    .replace(/;\s*secure/gi, '')
    .replace(/;\s*samesite=none/gi, '; SameSite=Lax')
    .replace(/;\s*partitioned/gi, '');
}
