/**
 * Netlify Function: /__health
 *
 * Netlify runs each request in an isolated invocation, so the counters that
 * server.mjs keeps in memory are meaningless here. Report runtime facts only.
 */
export default async () => new Response(JSON.stringify({
  ok: true,
  platform: 'netlify',
  runtime: `node ${process.version}`,
  region: process.env.AWS_REGION || process.env.NETLIFY_REGION || null,
  time: new Date().toISOString(),
}, null, 2), {
  status: 200,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
  },
});
