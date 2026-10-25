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

export async function loadWeather(m) {
  if (m.weather) return m.weather;
  if (CACHE[m.id] !== undefined) return CACHE[m.id];
  const home = teamById(m.homeId);
  const st = home && RAW.stadi && RAW.stadi[home.name];
  if (!st || !st.lat) return null;
  const days = Math.round((Date.now() - m.ts) / 86400000);
  if (days > 80 || days < -6) return null;
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
