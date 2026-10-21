/**
 * Netlify Function: /__api/*
 *
 * Reuses ventusky-local/lib/api.mjs unchanged by adapting the Node
 * (req, res) contract it expects to the Netlify Functions v2 Web API.
 */
import { handleApi } from '../../ventusky-local/lib/api.mjs';

function createRes() {
  const state = { status: 200, headers: {}, chunks: [] };
  const res = {
    writeHead(status, headers) {
      state.status = status;
      if (headers) {
        for (const [k, v] of Object.entries(headers)) state.headers[k.toLowerCase()] = v;
      }
      return res;
    },
    setHeader(k, v) { state.headers[k.toLowerCase()] = v; },
    getHeader(k) { return state.headers[k.toLowerCase()]; },
    removeHeader(k) { delete state.headers[k.toLowerCase()]; },
    end(body) { if (body != null) state.chunks.push(body); },
    get headersSent() { return state.chunks.length > 0; },
  };
  return { res, state };
}

function toResponse(state) {
  const headers = new Headers();
  for (const [k, v] of Object.entries(state.headers)) {
    if (v == null) continue;
    if (Array.isArray(v)) for (const item of v) headers.append(k, String(item));
    else headers.set(k, String(v));
  }
  const body = state.chunks.length
    ? Buffer.concat(state.chunks.map(c => (typeof c === 'string' ? Buffer.from(c) : Buffer.from(c))))
    : null;
  return new Response(body, { status: state.status, headers });
}

export default async (request) => {
  const url = new URL(request.url);
  const { res, state } = createRes();
  const req = { method: request.method, headers: Object.fromEntries(request.headers) };
  try {
    await handleApi(req, res, url);
  } catch (err) {
    if (!state.chunks.length) {
      state.status = 500;
      state.headers['content-type'] = 'application/json; charset=utf-8';
      state.chunks.push(JSON.stringify({ error: 'function_error', message: err.message }));
    }
  }
  return toResponse(state);
};
