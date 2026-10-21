// Rewrites Ventusky absolute URLs so the original frontend can run behind
// a single local origin. This is a local-study proxy; it does not modify
// the application logic.
const NON_WWW_HOST = /(https?:)?\/\/([a-z0-9.-]+\.ventusky\.com)(?=[/'"\s)<]|$)/gi;

export function rewriteVentuskyUrls(text) {
  if (!text) return text;
  // www is served at the local root so that path-based routing keeps working.
  text = text.replace(/https?:\/\/www\.ventusky\.com\/*/gi, '/');
  text = text.replace(/\/\/www\.ventusky\.com\/*/gi, '/');
  // The original bundle only whitelists the exact hostname `localhost`.
  // Allow the loopback IP as well so both URLs work.
  text = text.replace('|^localhost$', '|^(localhost|127\\.0\\.0\\.1)$');
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
