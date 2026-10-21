import { fetchText, decodeHtml } from './upstream.mjs';

const SLOT_HOURS = ['01:00', '04:00', '07:00', '10:00', '13:00', '16:00', '19:00', '22:00'];

export function normalizeCoord(lat, lon) {
  const a = Number(lat), b = Number(lon);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a < -90 || a > 90 || b < -180 || b > 180) {
    throw new Error('lat/lon must be finite and within [-90,90] / [-180,180]');
  }
  return `${a.toFixed(5).replace(/\.?0+$/, '')};${b.toFixed(5).replace(/\.?0+$/, '')}`;
}

function stripTags(s) {
  return decodeHtml(String(s || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

export function parsePointHtml(html) {
  const out = {
    location: null,
    coordinates: null,
    altitude: null,
    timezone: null,
    units: {},
    days: [],
    hourly24: [],
    waterUrl: null,
    aqiUrl: null,
    weatherCodes: {},
  };
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (title) out.title = stripTags(title[1]);
  const dataTitle = html.match(/<h1[^>]*data-title="([^"]*)"/i);
  if (dataTitle) out.title = decodeHtml(dataTitle[1]);
  const h1 = html.match(/<h1[^>]*data-title="[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) out.location = stripTags(h1[1]);
  if (out.title && (!out.location || out.location === 'Location')) {
    const m = out.title.match(/^Weather\s*-\s*(.*?)\s*-\s*14-Day/i);
    if (m) out.location = m[1].trim();
  }
  const note = html.match(/<p class="note p-0">([\s\S]*?)<\/p>/i);
  if (note) {
    const text = stripTags(note[1]);
    out.note = text;
    const m = text.match(/(\d+)°(\d+)'\s*([NS])\s*\/\s*(\d+)°(\d+)'\s*([EW])/i);
    if (m) {
      const lat = (Number(m[1]) + Number(m[2]) / 60) * (m[3].toUpperCase() === 'S' ? -1 : 1);
      const lon = (Number(m[4]) + Number(m[5]) / 60) * (m[6].toUpperCase() === 'W' ? -1 : 1);
      out.coordinates = { lat, lon };
    }
    const alt = text.match(/Altitude\s+([\d.]+)\s*m/i);
    if (alt) out.altitude = Number(alt[1]);
    const tz = text.match(/([A-Za-z_]+(?:\/[A-Za-z0-9_+-]+)+)\s*\(UTC([+-]\d+)\)/);
    const utc = text.match(/\(UTC([+-]\d+)\)/);
    if (tz || utc) out.timezone = { name: tz ? tz[1] : null, utcOffset: Number((tz ? tz[2] : utc[1])) };
  }

  const dates = [];
  const sel = html.match(/<select[^>]*id="date_selector"[^>]*>([\s\S]*?)<\/select>/i);
  if (sel) {
    for (const m of sel[1].matchAll(/<option[^>]*value="(\d+)"[^>]*>([\s\S]*?)<\/option>/gi)) {
      dates.push({ key: `d_${m[1]}`, date: stripTags(m[2]) });
    }
  }

  const fc = html.match(/<custom-forecast[^>]*data-forecast='([^']+)'/i) || html.match(/<custom-forecast[^>]*data-forecast="([^"]+)"/i);
  if (fc) {
    let raw;
    try { raw = JSON.parse(decodeHtml(fc[1])); } catch (e) { raw = null; }
    if (raw) {
      out.units = raw.units || {};
      out.weatherCodes = raw.sDesc || {};
      out.daysCount = raw.dc || null;
      for (const d of dates) {
        const day = raw[d.key];
        if (!day) continue;
        const slots = [];
        for (let i = 0; i < 8; i++) {
          const code = day.s?.[i] ?? null;
          slots.push({
            localTime: SLOT_HOURS[i],
            weatherCode: code,
            weather: code == null ? null : (raw.sDesc?.[String(Math.abs(code))] || null),
            night: code != null ? code < 0 : null,
            temperature: day.td?.[i] ?? null,
            precipitation: day.sr?.[i] ?? null,
            precipitationProbability: day.rp?.[i] ?? null,
            windSpeed: day.vsd?.[i] ?? null,
            windGust: day.vg?.[i] ?? null,
            windDirectionDeg: day.vd45?.[i] ?? null,
            windDirection: day.vdId?.[i] ?? null,
            temperatureClass: day.tc?.[i] ?? null,
          });
        }
        out.days.push({ key: d.key, date: d.date, slots });
      }
      out.rawKeys = Object.keys(raw).filter(k => k.startsWith('d_'));
    }
  }

  const sec24 = html.match(/<div id="forecast_24"[\s\S]*?<table[\s\S]*?<thead>([\s\S]*?)<\/thead>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/i);
  if (sec24) {
    const headers = [...sec24[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map(m => stripTags(m[1]));
    const tomorrowDate = dates[0]?.date || null;
    let todayDate = null;
    if (tomorrowDate) {
      const d = new Date(tomorrowDate.replace(/\//g, '-') + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() - 1);
      todayDate = d.toISOString().slice(0, 10);
    }
    const cells = [...sec24[2].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => m[1]);
    cells.forEach((cell, i) => {
      const header = headers[i] || '';
      const time = (header.match(/(\d{1,2}:\d{2})/) || [])[1] || null;
      const tomorrow = /tomorrow/i.test(header);
      const img = cell.match(/<img[^>]*alt="([^"]*)"/i);
      const temp = cell.match(/temperature_line[^"]*"[^>]*>\s*(-?\d+)/i);
      const precip = cell.match(/<span[^>]*>\s*([\d.]+)&nbsp;mm/i);
      const prob = cell.match(/precipitation-probability\s+(\d+)\s*%/i);
      const wind = cell.match(/wind_ico\s+arrow_(\d+)[^>]*>([^<]*)</i);
      const speed = cell.match(/<div[^>]*>\s*(\d+)&nbsp;km\/h/i);
      out.hourly24.push({
        time,
        date: tomorrow ? tomorrowDate : todayDate,
        weather: img ? decodeHtml(img[1]) : null,
        temperature: temp ? Number(temp[1]) : null,
        precipitation: precip ? Number(precip[1]) : null,
        precipitationProbability: prob ? Number(prob[1]) : null,
        windDirection: wind ? decodeHtml(wind[2]).trim() : null,
        windDirectionDeg: wind ? Number(wind[1]) : null,
        windSpeed: speed ? Number(speed[1]) : null,
      });
    });
  }

  const water = html.match(/data-water="([^"]+)"/i);
  if (water) out.waterUrl = decodeHtml(water[1]);
  const aqi = html.match(/data-aqi="([^"]+)"/i);
  if (aqi) out.aqiUrl = decodeHtml(aqi[1]);
  return out;
}

export async function fetchPoint(lat, lon, { lang = 'en', water = false } = {}) {
  const coord = normalizeCoord(lat, lon);
  const url = `https://www.ventusky.com/${coord}?ajax${lang ? `&lang=${encodeURIComponent(lang)}` : ''}`;
  const html = await fetchText(url, { headers: { 'x-requested-with': 'XMLHttpRequest' } });
  const parsed = parsePointHtml(html);
  parsed.requested = { lat: Number(lat), lon: Number(lon), coord, url };
  if (water && parsed.waterUrl) {
    try { parsed.water = await fetchWater(parsed.waterUrl); } catch (e) { parsed.waterError = e.message; }
  }
  return parsed;
}

export async function fetchWater(url) {
  const html = await fetchText(url);
  const out = { url, series: {}, dayCount: null, startTime: null };
  for (const m of html.matchAll(/<a[^>]*data-link="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const link = decodeHtml(m[1]);
    const label = stripTags(m[2]).replace(/\s*\([^)]*\)\s*$/, '');
    const unitMatch = stripTags(m[2]).match(/\(([^)]+)\)\s*$/);
    const params = new URLSearchParams(link.replace(/&amp;/g, '&'));
    const type = params.get('type') || link.split('&')[0];
    const data = params.get('data') || '';
    const time = params.get('time');
    const days = data.split(':').map(seg => seg.split(';').map(v => v === '' ? null : Number(v)));
    out.series[type] = {
      type,
      label,
      unit: unitMatch ? unitMatch[1] : null,
      startTime: time ? new Date(Number(time) * 1000).toISOString() : null,
      segments: days,
      segmentCount: days.length,
      valuesPerSegment: days.map(x => x.length),
    };
    if (days.length > (out.segmentCount || 0)) out.segmentCount = days.length;
    if (time && !out.startTime) out.startTime = new Date(Number(time) * 1000).toISOString();
  }
  return out;
}
