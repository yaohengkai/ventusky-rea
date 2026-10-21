import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// `import.meta.url` is not available when a function bundler emits CommonJS;
// fall back to the working directory so the data path lookup below still works.
// The local name is not `__dirname`: a CommonJS bundle already provides that
// identifier, and redeclaring it is a SyntaxError.
const moduleDir = (() => {
  try { return path.dirname(fileURLToPath(import.meta.url)); } catch { return process.cwd(); }
})();
let catalog;

// Where catalog.json lives. Locally that is ../data next to lib/; on Netlify the
// file is copied into the function bundle by `included_files`, so the working
// directory or the bundle root also needs to be checked.
const DATA_CANDIDATES = [
  process.env.VENTUSKY_DATA_DIR,
  path.join(moduleDir, '..', 'data'),
  path.join(moduleDir, 'ventusky-local', 'data'),
  path.join(moduleDir, '..', '..', 'ventusky-local', 'data'),
  path.join(process.cwd(), 'ventusky-local', 'data'),
  path.join(process.cwd(), 'data'),
];

export function dataDir() {
  for (const dir of DATA_CANDIDATES) {
    if (dir && fs.existsSync(path.join(dir, 'catalog.json'))) return dir;
  }
  throw new Error('catalog.json not found; set VENTUSKY_DATA_DIR to the directory that contains it');
}

export function getCatalog() {
  if (!catalog) catalog = JSON.parse(fs.readFileSync(path.join(dataDir(), 'catalog.json'), 'utf8'));
  return catalog;
}

function pad(n, l = 2) { return String(n).padStart(l, '0'); }
function utcParts(date) {
  return {
    yyyy: date.getUTCFullYear(),
    MM: pad(date.getUTCMonth() + 1),
    dd: pad(date.getUTCDate()),
    HH: pad(date.getUTCHours()),
    mm: pad(date.getUTCMinutes()),
    stamp: `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}_${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}`,
  };
}
function asDate(value) {
  if (value instanceof Date) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid time: ${value}`);
  return d;
}
function cacheFor(model) {
  const sec = Math.floor(new Date(model.updated).getTime() / 1000);
  return String(sec).replace(/0+$/, '');
}
export function modelLayer(modelId, layerId) {
  const c = getCatalog();
  const model = c.models[modelId];
  const layer = c.layers[layerId];
  if (!model) throw new Error(`Unknown model: ${modelId}`);
  if (!layer) throw new Error(`Unknown layer: ${layerId}`);
  const ml = layer.models.find(x => x.model === modelId);
  if (!ml) throw new Error(`Layer ${layerId} is not available for model ${modelId}`);
  return { catalog: c, model, layer, ml };
}

/**
 * Build one or more raster URLs for a model/layer/time.
 * Returns { urls, primary, model, layer, time, tile, archive }.
 */
export function buildTileUrls({ model, layer, time, tileX, tileY, zoom, host, includeAux = false, minute }) {
  const { catalog: c, model: m, layer: l, ml } = modelLayer(model, layer);
  const t = asDate(time);
  const p = utcParts(t);
  const minuteValue = minute != null ? pad(Number(minute)) : p.mm;
  const useMinutes = ml.minuteResolution;
  const folder = ml.minuteFolder ? `/${useMinutes ? minuteValue : p.mm}` : '';
  const stamp = `${p.stamp.slice(0, 9)}${useMinutes ? minuteValue : p.mm}`;
  // p.stamp is yyyyMMdd_HHmm; for non-minute layers only HH is used.
  const fileStamp = useMinutes ? `${p.yyyy}${p.MM}${p.dd}_${p.HH}${minuteValue}` : `${p.yyyy}${p.MM}${p.dd}_${p.HH}`;
  const tilesRequested = tileX != null && tileY != null;
  const tiled = tilesRequested || (zoom != null && m.raster.minZoomForTiles != null && Number(zoom) >= m.raster.minZoomForTiles);
  const tilePart = tiled ? `_${Number(tileX) || 0}_${Number(tileY) || 0}` : '';
  const now = Date.now();
  const archive = host ? host === 'archive' : t.getTime() < now - 72 * 3600 * 1000;
  const hostName = archive ? 'archive.ventusky.com' : 'data.ventusky.com';
  const cache = cacheFor(m);
  const base = `https://${hostName}/${p.yyyy}/${p.MM}/${p.dd}/${ml.modelDir}/${tiled ? 'tilled_world' : 'whole_world'}/hour_${p.HH}${folder}`;
  const fields = [...l.fields, ...(includeAux ? (l.auxFields || []) : [])];
  const urls = fields.map(field => `${base}/${ml.modelDir}_${field}${tilePart}_${fileStamp}.jpg?${cache}`);
  return {
    urls,
    primary: urls[0],
    model, layer, time: t.toISOString(),
    modelDir: ml.modelDir,
    field: fields[0],
    fields,
    tiled,
    tile: tiled ? { x: Number(tileX) || 0, y: Number(tileY) || 0 } : null,
    archive,
    cache,
    host: hostName,
    raster: m.raster,
    validFrom: ml.validFrom,
    validTo: ml.validTo,
    intervalMinutes: ml.intervalMinutes,
  };
}

export function listTimes({ model, layer, from, to, limit = 500 }) {
  const { ml } = modelLayer(model, layer);
  const start = from ? asDate(from) : new Date(ml.validFrom);
  const end = to ? asDate(to) : new Date(ml.validTo);
  const step = ml.intervalMinutes * 60 * 1000;
  const out = [];
  // Align to the interval grid.
  let t = Math.ceil(start.getTime() / step) * step;
  while (t <= end.getTime() && out.length < limit) {
    out.push(new Date(t).toISOString());
    t += step;
  }
  return { model, layer, intervalMinutes: ml.intervalMinutes, from: start.toISOString(), to: end.toISOString(), times: out, truncated: out.length >= limit };
}

export function defaultTime(model, layer) {
  const { ml } = modelLayer(model, layer);
  const now = Date.now();
  const start = new Date(ml.validFrom).getTime();
  const end = new Date(ml.validTo).getTime();
  const step = ml.intervalMinutes * 60 * 1000;
  const t = Math.min(Math.max(Math.floor(now / step) * step, start), end);
  return new Date(t).toISOString();
}
