import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCatalog, buildTileUrls, listTimes, defaultTime, modelLayer } from './tiles.mjs';
import { fetchText, fetchJson, fetchBuffer, decodeHtml } from './upstream.mjs';
import { fetchPoint, fetchWater, normalizeCoord } from './forecast.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'data');
const WAQI_TOKEN = process.env.WAQI_TOKEN || '904a1bc6edf77c428347f2fe54cf663bcffaec21';
let catalog = null;
function loadCatalog() {
  if (!catalog) catalog = JSON.parse(fs.readFileSync(path.join(DATA, 'catalog.json'), 'utf8'));
  return catalog;
}

function json(res, status, obj, extra = {}) {
  const body = Buffer.from(JSON.stringify(obj, null, 2), 'utf8');
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(body.length),
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*',
    ...extra,
  });
  res.end(body);
}
function text(res, status, body, type = 'text/plain; charset=utf-8') {
  const buf = Buffer.from(body, 'utf8');
  res.writeHead(status, { 'content-type': type, 'content-length': String(buf.length), 'access-control-allow-origin': '*' });
  res.end(buf);
}
function bad(res, message, status = 400) { return json(res, status, { error: status === 404 ? 'not_found' : 'bad_request', message }); }

function qp(url, name, fallback) {
  const v = url.searchParams.get(name);
  return v == null || v === '' ? fallback : v;
}
function needModelLayer(url) {
  const model = qp(url, 'model');
  const layer = qp(url, 'layer');
  if (!model || !layer) throw new Error('model and layer query parameters are required');
  modelLayer(model, layer); // validate availability
  return { model, layer };
}

function stampParts(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error('invalid time');
  const p = n => String(n).padStart(2, '0');
  return {
    yyyy: d.getUTCFullYear(), MM: p(d.getUTCMonth() + 1), dd: p(d.getUTCDate()), HH: p(d.getUTCHours()),
    stamp: `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}_${p(d.getUTCHours())}`,
    date: d,
  };
}

function jsonDataUrl({ model, layer, time, kind }) {
  const { model: m, layer: l, ml } = modelLayer(model, layer);
  const p = stampParts(time);
  const archive = p.date.getTime() < Date.now() - 72 * 3600 * 1000;
  const host = archive ? 'archive.ventusky.com' : 'data.ventusky.com';
  const cache = String(Math.floor(new Date(m.updated).getTime() / 1000)).replace(/0+$/, '');
  const field = kind === 'isolines' ? (l.fields[0] || 'tlak') : null;
  const name = kind === 'pressure' ? 'pressure_low_high' : kind === 'fronts' ? 'fronts' : `iso_${field}`;
  return {
    url: `https://${host}/${p.yyyy}/${p.MM}/${p.dd}/${ml.modelDir}/whole_world/hour_${p.HH}/${ml.modelDir}_${name}_${p.stamp}.json?${cache}`,
    archive, cache, modelDir: ml.modelDir,
  };
}

async function apiTileUrl(req, res, url) {
  const { model, layer } = needModelLayer(url);
  const time = qp(url, 'time', defaultTime(model, layer));
  const tileX = url.searchParams.has('tileX') ? Number(qp(url, 'tileX')) : undefined;
  const tileY = url.searchParams.has('tileY') ? Number(qp(url, 'tileY')) : undefined;
  const zoom = url.searchParams.has('zoom') ? Number(qp(url, 'zoom')) : undefined;
  const host = qp(url, 'host', undefined);
  const includeAux = qp(url, 'aux', '0') === '1';
  const out = buildTileUrls({ model, layer, time, tileX, tileY, zoom, host, includeAux });
  return json(res, 200, out);
}

async function apiTile(req, res, url) {
  const { model, layer } = needModelLayer(url);
  const time = qp(url, 'time', defaultTime(model, layer));
  const tileX = url.searchParams.has('tileX') ? Number(qp(url, 'tileX')) : undefined;
  const tileY = url.searchParams.has('tileY') ? Number(qp(url, 'tileY')) : undefined;
  const zoom = url.searchParams.has('zoom') ? Number(qp(url, 'zoom')) : undefined;
  const host = qp(url, 'host', undefined);
  const which = Math.max(0, Number(qp(url, 'index', '0')));
  const out = buildTileUrls({ model, layer, time, tileX, tileY, zoom, host });
  const target = out.urls[which];
  if (!target) return bad(res, 'tile index out of range', 404);
  const { buf, type } = await fetchBuffer(target);
  res.writeHead(200, {
    'content-type': type,
    'content-length': String(buf.length),
    'cache-control': 'public, max-age=300',
    'access-control-allow-origin': '*',
    'x-ventusky-source': target,
  });
  res.end(buf);
}

async function apiPoint(req, res, url) {
  const lat = qp(url, 'lat');
  const lon = qp(url, 'lon');
  if (lat == null || lon == null) return bad(res, 'lat and lon are required');
  const lang = qp(url, 'lang', 'en');
  const water = qp(url, 'water', '1') !== '0';
  const out = await fetchPoint(lat, lon, { lang, water });
  return json(res, 200, out);
}

async function apiWater(req, res, url) {
  let target = qp(url, 'url');
  if (!target) {
    const lat = qp(url, 'lat'); const lon = qp(url, 'lon');
    if (lat == null || lon == null) return bad(res, 'url or lat/lon are required');
    const coord = normalizeCoord(lat, lon);
    const html = await fetchText(`https://www.ventusky.com/${coord}?ajax`);
    const m = html.match(/data-water="([^"]+)"/i);
    if (!m) return json(res, 404, { error: 'not_found', message: 'No water forecast for this location' });
    target = decodeHtml(m[1]);
  }
  return json(res, 200, await fetchWater(target));
}

async function apiJsonData(req, res, url, kind) {
  const { model, layer } = needModelLayer(url);
  const time = qp(url, 'time', defaultTime(model, layer));
  const built = jsonDataUrl({ model, layer, time, kind });
  const data = await fetchJson(built.url);
  return json(res, 200, { source: built.url, archive: built.archive, data });
}

export async function handleApi(req, res, url) {
  const p = url.pathname.replace(/\/+$/, '');
  try {
    if (p === '/__api' || p === '/__api/catalog') return json(res, 200, loadCatalog());
    if (p === '/__api/models') {
      const c = loadCatalog();
      return json(res, 200, c.modelOrder.map(id => c.models[id]));
    }
    if (p.startsWith('/__api/models/')) {
      const id = decodeURIComponent(p.split('/').pop());
      const m = loadCatalog().models[id];
      return m ? json(res, 200, m) : bad(res, `unknown model: ${id}`, 404);
    }
    if (p === '/__api/layers') {
      const c = loadCatalog();
      return json(res, 200, Object.values(c.layers));
    }
    if (p.startsWith('/__api/layers/')) {
      const id = decodeURIComponent(p.split('/').pop());
      const l = loadCatalog().layers[id];
      return l ? json(res, 200, l) : bad(res, `unknown layer: ${id}`, 404);
    }
    if (p === '/__api/times') {
      const { model, layer } = needModelLayer(url);
      return json(res, 200, listTimes({ model, layer, from: qp(url, 'from'), to: qp(url, 'to'), limit: Number(qp(url, 'limit', '500')) }));
    }
    if (p === '/__api/tile-url') return await apiTileUrl(req, res, url);
    if (p === '/__api/tile') return await apiTile(req, res, url);
    if (p === '/__api/point') return await apiPoint(req, res, url);
    if (p === '/__api/water') return await apiWater(req, res, url);
    if (p === '/__api/pressure') return await apiJsonData(req, res, url, 'pressure');
    if (p === '/__api/fronts') return await apiJsonData(req, res, url, 'fronts');
    if (p === '/__api/isolines') {
      const layer = qp(url, 'layer', 'pressure');
      url.searchParams.set('layer', layer);
      return await apiJsonData(req, res, url, 'isolines');
    }
    if (p === '/__api/cyclones') {
      const data = await fetchJson('https://data.ventusky.com/cyclones/actual.json');
      return json(res, 200, data);
    }
    if (p === '/__api/fires') {
      let z = Number(qp(url, 'z', '5'));
      let x = Number(qp(url, 'x', '0'));
      let y = Number(qp(url, 'y', '0'));
      if (!Number.isFinite(z) || !Number.isFinite(x) || !Number.isFinite(y)) return bad(res, 'z/x/y must be numbers');
      if (z > 6) { const f = 1 << (z - 6); x = Math.floor(x / f); y = Math.floor(y / f); z = 6; }
      const target = `https://data.ventusky.com/fires/${z}/${x}_${y}.json`;
      return json(res, 200, { source: target, data: await fetchJson(target) });
    }
    if (p === '/__api/webcams') {
      const lat = qp(url, 'lat'); const lon = qp(url, 'lon');
      if (lat == null || lon == null) return bad(res, 'lat and lon are required');
      const count = Number(qp(url, 'count', '4'));
      const target = `https://webcams.ventusky.com/api/api.get_nearest_camera.php?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&count=${count}`;
      return json(res, 200, { source: target, data: await fetchJson(target) });
    }
    if (p === '/__api/aqi') {
      const lat = qp(url, 'lat'); const lon = qp(url, 'lon');
      if (lat == null || lon == null) return bad(res, 'lat and lon are required');
      const target = `https://api.waqi.info/feed/geo:${encodeURIComponent(lat)};${encodeURIComponent(lon)}/?token=${encodeURIComponent(WAQI_TOKEN)}`;
      return json(res, 200, { source: target, data: await fetchJson(target) });
    }
    if (p === '/__api/location') {
      const lat = qp(url, 'lat'); const lon = qp(url, 'lon'); const zoom = qp(url, 'zoom', '5');
      if (lat == null || lon == null) return bad(res, 'lat and lon are required');
      const target = `https://www.ventusky.com/ventusky_location.json.php?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=${encodeURIComponent(zoom)}`;
      return json(res, 200, { source: target, data: await fetchJson(target) });
    }
    if (p === '/__api/search') {
      const q = qp(url, 'q');
      if (!q) return bad(res, 'q is required');
      const lang = qp(url, 'lang', 'en');
      const target = `https://www.ventusky.com/ventusky_mesta.php?q=${encodeURIComponent(q)}&lang=${encodeURIComponent(lang)}`;
      return json(res, 200, { source: target, data: await fetchJson(target) });
    }
    if (p === '/__api/docs') {
      return json(res, 200, {
        name: 'Ventusky Local Data API',
        version: 1,
        endpoints: [
          ['GET /__api/catalog', 'Full model/layer catalog'],
          ['GET /__api/models', 'All models'],
          ['GET /__api/models/:id', 'One model'],
          ['GET /__api/layers', 'All layers'],
          ['GET /__api/layers/:id', 'One layer'],
          ['GET /__api/times?model=&layer=&from=&to=', 'Valid-time grid'],
          ['GET /__api/tile-url?model=&layer=&time=&tileX=&tileY=&zoom=', 'Build raster URL(s)'],
          ['GET /__api/tile?model=&layer=&time=&tileX=&tileY=&zoom=&index=', 'Fetch raster image'],
          ['GET /__api/point?lat=&lon=&lang=&water=1', 'Point forecast, 24 h + 8 days + optional ocean water chart'],
          ['GET /__api/water?lat=&lon= or ?url=', 'Ocean wave/tide chart data'],
          ['GET /__api/pressure?model=&layer=&time=', 'Pressure highs/lows JSON'],
          ['GET /__api/fronts?model=&layer=&time=', 'Weather fronts JSON'],
          ['GET /__api/isolines?model=&layer=&time=', 'Isolines JSON'],
          ['GET /__api/cyclones', 'Active cyclones JSON'],
          ['GET /__api/fires?z=&x=&y=', 'Fire detections for a tile'],
          ['GET /__api/webcams?lat=&lon=&count=', 'Nearest webcams'],
          ['GET /__api/aqi?lat=&lon=', 'Current air quality (WAQI)'],
          ['GET /__api/search?q=&lang=', 'Location search'],
          ['GET /__api/location?lat=&lon=&zoom=', 'Nearest cities/POIs for a coordinate'],
        ],
      });
    }
    return bad(res, `unknown endpoint: ${url.pathname}`, 404);
  } catch (err) {
    console.error('[api]', url.pathname, err.message);
    const bad = /required|must be|not available|unknown model|unknown layer|invalid time|out of range/i.test(err.message);
    return json(res, bad ? 400 : 502, { error: bad ? 'bad_request' : 'upstream_error', message: err.message });
  }
}
