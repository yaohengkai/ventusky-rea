import fs from 'node:fs';

const T = JSON.parse(fs.readFileSync('T.json', 'utf8'));
const wa = JSON.parse(fs.readFileSync('wa.json', 'utf8'));
const Va = JSON.parse(fs.readFileSync('Va.json', 'utf8'));
const uiModels = JSON.parse(fs.readFileSync('models-ui.json', 'utf8'));
const dom = JSON.parse(fs.readFileSync('catalog.json', 'utf8'));

// Display metadata. Units are the units Ventusky uses in its UI/legends.
const META = {
  'temperature-water': ['Sea-surface temperature', '°C', 'Ocean'],
  'temperature-5cm': ['Temperature at 5 cm', '°C', 'Atmosphere'],
  'temperature-2m': ['Temperature at 2 m', '°C', 'Atmosphere'],
  'temperature-anomaly-2m': ['Temperature anomaly at 2 m', '°C', 'Atmosphere'],
  'temperature-950hpa': ['Temperature at 950 hPa', '°C', 'Atmosphere'],
  'temperature-925hpa': ['Temperature at 925 hPa', '°C', 'Atmosphere'],
  'temperature-900hpa': ['Temperature at 900 hPa', '°C', 'Atmosphere'],
  'temperature-850hpa': ['Temperature at 850 hPa', '°C', 'Atmosphere'],
  'temperature-800hpa': ['Temperature at 800 hPa', '°C', 'Atmosphere'],
  'temperature-750hpa': ['Temperature at 750 hPa', '°C', 'Atmosphere'],
  'temperature-700hpa': ['Temperature at 700 hPa', '°C', 'Atmosphere'],
  'temperature-650hpa': ['Temperature at 650 hPa', '°C', 'Atmosphere'],
  'temperature-600hpa': ['Temperature at 600 hPa', '°C', 'Atmosphere'],
  'temperature-500hpa': ['Temperature at 500 hPa', '°C', 'Atmosphere'],
  'temperature-400hpa': ['Temperature at 400 hPa', '°C', 'Atmosphere'],
  'temperature-300hpa': ['Temperature at 300 hPa', '°C', 'Atmosphere'],
  'temperature-200hpa': ['Temperature at 200 hPa', '°C', 'Atmosphere'],
  'temperature-10hpa': ['Temperature at 10 hPa', '°C', 'Atmosphere'],
  freezing: ['Freezing level', 'm', 'Atmosphere'],
  feel: ['Feels-like temperature', '°C', 'Atmosphere'],
  'rain-1h': ['Precipitation, 1 hour', 'mm', 'Atmosphere'],
  'rain-3h': ['Precipitation, 3 hours', 'mm', 'Atmosphere'],
  'rain-ac': ['Accumulated precipitation', 'mm', 'Atmosphere'],
  'precipitation-anomaly': ['Precipitation anomaly', '%', 'Atmosphere'],
  radar: ['Weather radar reflectivity', 'dBZ', 'Radar'],
  satellite: ['Satellite cloud imagery', 'image', 'Satellite'],
  'clouds-total': ['Total cloud cover', '%', 'Atmosphere'],
  'clouds-fog': ['Fog / low cloud', '%', 'Atmosphere'],
  'clouds-low': ['Low cloud cover', '%', 'Atmosphere'],
  'clouds-middle': ['Middle cloud cover', '%', 'Atmosphere'],
  'clouds-high': ['High cloud cover', '%', 'Atmosphere'],
  'cloud-base': ['Cloud base height', 'm', 'Atmosphere'],
  visibility: ['Visibility', 'km', 'Atmosphere'],
  'wind-10m': ['Wind at 10 m', 'km/h', 'Atmosphere'],
  'wind-100m': ['Wind at 100 m', 'km/h', 'Atmosphere'],
  'wind-250m': ['Wind at 250 m', 'km/h', 'Atmosphere'],
  'wind-950hpa': ['Wind at 950 hPa', 'km/h', 'Atmosphere'],
  'wind-925hpa': ['Wind at 925 hPa', 'km/h', 'Atmosphere'],
  'wind-900hpa': ['Wind at 900 hPa', 'km/h', 'Atmosphere'],
  'wind-850hpa': ['Wind at 850 hPa', 'km/h', 'Atmosphere'],
  'wind-800hpa': ['Wind at 800 hPa', 'km/h', 'Atmosphere'],
  'wind-750hpa': ['Wind at 750 hPa', 'km/h', 'Atmosphere'],
  'wind-700hpa': ['Wind at 700 hPa', 'km/h', 'Atmosphere'],
  'wind-650hpa': ['Wind at 650 hPa', 'km/h', 'Atmosphere'],
  'wind-600hpa': ['Wind at 600 hPa', 'km/h', 'Atmosphere'],
  'wind-500hpa': ['Wind at 500 hPa', 'km/h', 'Atmosphere'],
  'wind-400hpa': ['Wind at 400 hPa', 'km/h', 'Atmosphere'],
  'wind-300hpa': ['Wind at 300 hPa', 'km/h', 'Atmosphere'],
  'wind-200hpa': ['Wind at 200 hPa', 'km/h', 'Atmosphere'],
  'wind-10hpa': ['Wind at 10 hPa', 'km/h', 'Atmosphere'],
  gust: ['Wind gust, 1 hour', 'km/h', 'Atmosphere'],
  'gust-ac': ['Wind gust, accumulated maximum', 'km/h', 'Atmosphere'],
  pressure: ['Mean sea-level pressure', 'hPa', 'Atmosphere'],
  'geopotential-850hpa': ['Geopotential height, 850 hPa', 'm', 'Atmosphere'],
  'geopotential-500hpa': ['Geopotential height, 500 hPa', 'm', 'Atmosphere'],
  'geopotential-300hpa': ['Geopotential height, 300 hPa', 'm', 'Atmosphere'],
  cape: ['CAPE (convective available potential energy)', 'J/kg', 'Atmosphere'],
  'cape-shear': ['CAPE × shear', 'index', 'Atmosphere'],
  shear: ['Wind shear, 0–6 km', 'm/s', 'Atmosphere'],
  'hail-probability': ['Hail probability', '%', 'Atmosphere'],
  cin: ['CIN (convective inhibition)', 'J/kg', 'Atmosphere'],
  li: ['Lifted index', '°C', 'Atmosphere'],
  helicity: ['Storm-relative helicity, 0–3 km', 'm²/s²', 'Atmosphere'],
  'humidity-2m': ['Relative humidity at 2 m', '%', 'Atmosphere'],
  'humidity-900hpa': ['Relative humidity at 900 hPa', '%', 'Atmosphere'],
  'humidity-850hpa': ['Relative humidity at 850 hPa', '%', 'Atmosphere'],
  'humidity-700hpa': ['Relative humidity at 700 hPa', '%', 'Atmosphere'],
  dew: ['Dew point at 2 m', '°C', 'Atmosphere'],
  wave: ['Significant wave height', 'm', 'Ocean'],
  'wind-wave': ['Wind-wave height', 'm', 'Ocean'],
  'wind-wave-period': ['Wind-wave period', 's', 'Ocean'],
  swell: ['Swell wave height', 'm', 'Ocean'],
  'swell-period': ['Swell wave period', 's', 'Ocean'],
  currents: ['Ocean surface currents', 'km/h', 'Ocean'],
  'tide-currents': ['Tidal currents', 'km/h', 'Ocean'],
  tide: ['Tide height (MLLW datum)', 'm', 'Ocean'],
  'tide-surge': ['Tide + storm surge (MLLW datum)', 'm', 'Ocean'],
  snow: ['Snow cover depth', 'cm', 'Atmosphere'],
  'snow-new-ac': ['New snow, accumulated', 'cm', 'Atmosphere'],
  pm25: ['PM2.5', 'µg/m³', 'Air quality'],
  pm10: ['PM10', 'µg/m³', 'Air Quality'],
  no2: ['NO₂', 'µg/m³', 'Air quality'],
  so2: ['SO₂', 'µg/m³', 'Air quality'],
  o3: ['O₃', 'µg/m³', 'Air quality'],
  dust: ['Dust', 'µg/m³', 'Air quality'],
  co: ['CO', 'µg/m³', 'Air quality'],
  aqi: ['Air Quality Index', 'index', 'Air quality'],
  uv: ['UV index', 'index', 'Air quality'],
};

const UI_NAMES = {};
for (const g of dom.layers) {
  if (g.id) UI_NAMES[g.id] = g.name;
  for (const o of g.opts || []) UI_NAMES[o.v] = o.t;
}
UI_NAMES.radar = 'Radar';
UI_NAMES.satellite = 'Satellite';

const GROUP_LABEL = {
  temperature: 'Temperature', feel: 'Feels like', rain: 'Precipitation', radar: 'Radar',
  satellite: 'Satellite', clouds: 'Clouds', wind: 'Wind', gust: 'Wind gusts',
  pressure: 'Air pressure', storm: 'Thunderstorms', humidity: 'Humidity', sea: 'Sea / ocean',
  snow: 'Snow cover', air: 'Air quality',
};
const DEFAULT_SIZE = { width: 1440, height: 721, uh: 512, sh: 512 };
const models = {};
const layerMap = {};

function modelKind(id) {
  if (['rtofs', 'smoc', 'stofs', 'stofs_us', 'mfwam', 'wavewatch_no'].includes(id)) return 'ocean';
  if (['goes', 'goes16', 'himawari', 'meteosat', 'meteosat_hd'].includes(id)) return 'satellite';
  if (['eurad', 'earad', 'usrad', 'worad', 'worad_hres', 'ukmo', 'ukmo_uk'].includes(id)) return 'radar';
  if (id === 'cams' || id === 'silam' || id === 'silam_eu') return 'air-quality';
  return 'weather';
}

for (const [id, m] of Object.entries(T)) {
  const size = { ...DEFAULT_SIZE, ...(m.size || {}) };
  const tileW = size.uh || 512;
  const tileH = size.sh || 512;
  const extent = {
    lon: (size.Ig != null && size.Hg != null) ? [size.Ig, size.Hg] : [-180, 180],
    lat: (size.Cg != null && size.wg != null) ? [size.Cg, size.wg] : [-90, 90],
  };
  const publicModel = uiModels.find(x => x.v === id);
  models[id] = {
    id,
    name: m.name,
    uiName: publicModel?.t || m.name,
    public: Boolean(publicModel),
    kind: modelKind(id),
    source: m.source || [],
    attribution: m.nd || [],
    resolution: size.fc || null,
    intervalMinutes: m.c || (m.N === 60 ? 60 : 180),
    horizonHours: m.N || null,
    timelineStart: m.start ? new Date(m.start).toISOString() : null,
    timelineEnd: m.end ? new Date(m.end).toISOString() : null,
    updated: m.J ? new Date(m.J).toISOString() : null,
    startsAt: m.start ? new Date(m.start).toISOString() : null,
    endsAt: m.end ? new Date(m.end).toISOString() : null,
    raster: {
      width: size.width,
      height: size.height,
      tileWidth: tileW,
      tileHeight: tileH,
      cols: Math.ceil(size.width / tileW),
      rows: Math.ceil(size.height / tileH),
      extent,
      minZoomForTiles: size.Ba ?? null,
      layout: 'equirectangular',
      note: 'The .jpg rasters are equirectangular model fields; tilled_world files are fixed chunks of that raster, not Web-Mercator XYZ tiles.',
    },
    layers: Object.keys(m.K || {}),
  };
}

// Build layer records from the menu definition and the model map.
const groupOrder = [];
for (const g of wa) {
  groupOrder.push(g.id);
  const list = g.o ? g.o : [g];
  for (const o of list) {
    const id = o.id;
    const meta = META[id] || [UI_NAMES[id] || id, '', 'Other'];
    let kind = 'scalar';
    if (g.id === 'wind') kind = 'vector-wind';
    else if (g.id === 'sea') {
      if (o.id === 'currents' || o.id === 'tide-currents') kind = 'vector-currents';
      else if (['wave','wind-wave','wind-wave-period','swell','swell-period'].includes(o.id)) kind = 'wave';
    } else if (g.id === 'radar') kind = 'radar';
    else if (g.id === 'satellite') kind = 'satellite';

    const fields = Array.isArray(o.file) ? o.file.slice() : (o.file ? [o.file] : []);
    const entry = {
      id,
      group: g.id,
      groupLabel: GROUP_LABEL[g.id] || g.id,
      name: meta[0],
      uiName: UI_NAMES[id] || meta[0],
      unit: meta[1],
      domain: meta[2],
      kind,
      altitude: o.H || null,
      fields,
      models: [],
      descriptionId: o.description || null,
      auxFields: o.$j?.typed ? o.$j.typed.slice(1) : [],
    };
    if (kind === 'vector-wind' || kind === 'vector-currents') {
      const v = Va[o.H] || Va[o.label];
      if (v) {
        entry.vector = { u: v.Ch, v: v.bh, scale: v.yh ?? null };
        entry.fields = [v.Ch, v.bh];
      }
    }
    if (kind === 'wave') {
      const v = Va[o.H];
      if (v) {
        const base = entry.fields.slice();
        if (!o.id.includes('period') && v.direction && !base.includes(v.direction)) base.push(v.direction);
        entry.wave = {
          height: entry.fields[0],
          direction: o.id.includes('period') ? null : v.direction,
          threshold: v.threshold ?? null,
          swell: v.D ? { height: v.D.height, direction: v.D.direction, threshold: v.D.threshold ?? null } : null,
        };
        entry.fields = base;
      }
    }
    layerMap[id] = entry;
  }
}

for (const [modelId, m] of Object.entries(T)) {
  for (const layerId of Object.keys(m.K || {})) {
    if (!layerMap[layerId]) continue;
    const cfg = m.K[layerId];
    const interval = cfg.c || m.c || (m.N === 60 ? 60 : 180);
    layerMap[layerId].models.push({
      model: modelId,
      modelDir: cfg.yg || modelId,
      cacheFrom: modelId,
      intervalMinutes: interval,
      horizonHours: cfg.N || m.N || null,
      validFrom: new Date(cfg.start || m.start).toISOString(),
      validTo: new Date(cfg.end || m.end).toISOString(),
      updated: new Date(cfg.J || m.J).toISOString(),
      variant: cfg.variant || null,
      minuteResolution: layerId === 'radar' || layerId === 'satellite',
      minuteFolder: Boolean((m.size || {}).Pl) && layerId === 'satellite',
      note: cfg.yg ? `Raster files use the ${cfg.yg} prefix.` : null,
    });
  }
}

// Order groups / layers in the same order as the Ventusky menu.
const layers = {};
for (const g of wa) {
  const list = g.o ? g.o : [g];
  for (const o of list) if (layerMap[o.id]) layers[o.id] = layerMap[o.id];
}
// Add radar/satellite if missing (single menu items).
for (const [id, e] of Object.entries(layerMap)) if (!layers[id]) layers[id] = e;

const catalog = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: 'https://www.ventusky.com/ (public frontend configuration, captured 2026-10-21)',
  disclaimer: 'For personal study only. Weather data belongs to Ventusky and its providers. Do not redistribute or use commercially.',
  hosts: {
    site: 'https://www.ventusky.com',
    static: 'https://static.ventusky.com',
    data: 'https://data.ventusky.com',
    archive: 'https://archive.ventusky.com',
    map: 'https://map.ventusky.com',
    webcams: 'https://webcams.ventusky.com',
  },
  modelOrder: Object.keys(T),
  publicModels: uiModels.filter(x => x.v !== 'auto').map(x => x.v),
  groups: groupOrder,
  models,
  layers,
  timeRules: {
    utc: true,
    archiveAfterHours: 72,
    archiveHost: 'archive.ventusky.com',
    cacheParam: 'last update timestamp in seconds, trailing zeros stripped',
    filenameTime: 'yyyyMMdd_HH[mm]',
    tiledTime: 'same as global, with _tileX_tileY before the timestamp',
  },
};

fs.writeFileSync('../ventusky-local/data/catalog.json', JSON.stringify(catalog, null, 2));
console.log('models', Object.keys(models).length, 'layers', Object.keys(layers).length);
console.log('public', catalog.publicModels.join(','));
