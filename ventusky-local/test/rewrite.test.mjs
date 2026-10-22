// Regression tests for the hostname allow-list patch in rewrite.mjs.
//
// The upstream bundle only boots when `location.hostname` matches
// *.ventusky.com or exactly `localhost`. Otherwise it calls
// window.open("https://www.ventusky.com/", "_top"). Because the proxy rewrites
// that URL to "/", an unlisted host (e.g. *.netlify.app) reloads the page
// forever and never removes the no-JS fallback. rewriteVentuskyUrls() must add
// the host that actually served the response to that allow-list.
//
// Run with: node --test test/   (from ventusky-local/)
import test from 'node:test';
import assert from 'node:assert/strict';
import { rewriteVentuskyUrls } from '../lib/rewrite.mjs';

const SOURCE = String.raw`"HTMLCanvasElement"in H?/ve(\/)?nt(\\)?us(\/)?ky\.com$|^localhost$/.test(location.hostname)?a():H.open("https://www.ventusky.com/","_top")`;

function hostnameGuard(text) {
  const match = text.match(/\/ve[\s\S]*?\.test\(location\.hostname\)/);
  assert.ok(match, 'hostname guard not found — the upstream bundle probably changed');
  const literal = match[0];
  return new RegExp(literal.slice(1, literal.lastIndexOf('/')));
}

test('accepts the host that served the page', () => {
  for (const host of [
    'localhost',
    '127.0.0.1',
    'calm-pika-123.netlify.app',
    'deploy-preview-3--my-site.netlify.app',
    'maps.example.com',
  ]) {
    const guard = hostnameGuard(rewriteVentuskyUrls(SOURCE, host));
    assert.equal(guard.test(host), true, `guard should accept ${host}`);
    assert.equal(guard.test('attacker.example'), false, `${host} must not open the guard`);
  }
});

test('accepts multiple candidate hostnames', () => {
  const guard = hostnameGuard(
    rewriteVentuskyUrls(SOURCE, ['internal.example', 'my-site.netlify.app']),
  );
  assert.equal(guard.test('my-site.netlify.app'), true);
  assert.equal(guard.test('internal.example'), true);
  assert.equal(guard.test('other.example'), false);
});

test('keeps loopback working without an explicit host', () => {
  const guard = hostnameGuard(rewriteVentuskyUrls(SOURCE));
  assert.equal(guard.test('localhost'), true);
  assert.equal(guard.test('127.0.0.1'), true);
  assert.equal(guard.test('my-site.netlify.app'), false);
});

test('does not let a forged hostname inject code into the bundle', () => {
  for (const evil of ['evil/;alert(1)//', 'a"b', 'x)y(', 'foo bar', 'a$`b']) {
    const out = rewriteVentuskyUrls(SOURCE, evil);
    assert.ok(!out.includes('alert'), `code injected via ${JSON.stringify(evil)}`);
    // The result must still be a valid regex literal.
    assert.doesNotThrow(() => hostnameGuard(out));
  }
});

test('still rewrites ventusky.com URLs through the proxy', () => {
  const html = rewriteVentuskyUrls(
    '<script src="https://static.ventusky.com/media/script-en.js"></script>'
    + '<link rel="canonical" href="https://www.ventusky.com/">',
    'my-site.netlify.app',
  );
  assert.ok(html.includes('/proxy/static.ventusky.com/media/script-en.js'));
  assert.ok(html.includes('href="/"'));
});
