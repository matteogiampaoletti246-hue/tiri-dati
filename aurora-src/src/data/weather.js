// Meteo allo stadio all'ora del calcio d'inizio (open-meteo, senza chiave).
import { RAW } from './load';
import { teamById } from './teams';

const CACHE = {};

const iconOf = (code, wind) => {
  if (wind >= 35) return 'wind';
  if (code <= 1) return 'sun';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 86) || code >= 95) return 'rain';
  return 'cloud';
};

// campionati aggiunti: la posizione dello stadio si cerca per nome (geocoding open-meteo), una volta sola per stadio
const GEO = {};
async function geoStadium(name, fallback) {
  const key = String(name || fallback || '').toLowerCase();
  if (!key) return null;
  if (GEO[key] !== undefined) return GEO[key];
  const tries = [name, String(name || '').replace(/\b(stadium|stadion|stadio|arena|park|ground|estadio|estádio|stade)\b/gi, '').trim(), fallback].filter((x) => x && x.length > 2);
  for (const q of tries) {
    try {
      const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en`);
      const d = await r.json();
      const hit = d && d.results && d.results[0];
      if (hit) { GEO[key] = { lat: hit.latitude, lon: hit.longitude }; return GEO[key]; }
    } catch { /* si prova con il nome successivo */ }
  }
  GEO[key] = null;
  return null;
}

export async function loadWeather(m) {
  if (m.weather) return m.weather;
  if (CACHE[m.id] !== undefined) return CACHE[m.id];
  const home = teamById(m.homeId);
  let st = home && RAW.stadi && RAW.stadi[home.name];
  const days = Math.round((Date.now() - m.ts) / 86400000);
  if ((!st || !st.lat) && m.archive && m.stadium) {
    st = await geoStadium(m.stadium, home && home.name);
  }
  if (!st || !st.lat) return null;
  if (days < (m.archive ? -3 : -6)) return null;
  if (days > 80) {
    // partita vecchia: dati storici (solo campionati aggiunti e archivio)
    if (!m.archive) return null;
    try {
      const iso = new Date(m.ts).toISOString().slice(0, 10);
      const r = await fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${st.lat}&longitude=${st.lon}&start_date=${iso}&end_date=${iso}&hourly=temperature_2m,wind_speed_10m,weather_code&timezone=GMT`);
      const d = await r.json();
      const key = `${new Date(m.ts).toISOString().slice(0, 13)}:00`;
      const i = d.hourly.time.indexOf(key);
      if (i < 0) { CACHE[m.id] = null; return null; }
      const w = { temp: Math.round(d.hourly.temperature_2m[i]), wind: Math.round(d.hourly.wind_speed_10m[i]), icon: iconOf(d.hourly.weather_code[i], d.hourly.wind_speed_10m[i]) };
      CACHE[m.id] = w;
      m.weather = w;
      return w;
    } catch {
      return null;
    }
  }
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${st.lat}&longitude=${st.lon}&hourly=temperature_2m,wind_speed_10m,weather_code&timezone=GMT&past_days=${Math.max(1, Math.min(92, days + 1))}&forecast_days=7`;
    const r = await fetch(url);
    const d = await r.json();
    const key = `${new Date(m.ts).toISOString().slice(0, 13)}:00`;
    const i = d.hourly.time.indexOf(key);
    if (i < 0) {
      CACHE[m.id] = null;
      return null;
    }
    const w = { temp: Math.round(d.hourly.temperature_2m[i]), wind: Math.round(d.hourly.wind_speed_10m[i]), icon: iconOf(d.hourly.weather_code[i], d.hourly.wind_speed_10m[i]) };
    CACHE[m.id] = w;
    m.weather = w;
    return w;
  } catch {
    return null;
  }
}
