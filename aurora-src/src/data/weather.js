// Meteo allo stadio all'ora del calcio d'inizio (open-meteo, senza chiave).
import { RAW, BASE } from './load';
import { teamById } from './teams';
import { roseOf, loadRose } from './rose';
import { teamFmId } from './teamIndex';
import { archIndex } from './archive';

const CACHE = {};

const iconOf = (code, wind) => {
  if (wind >= 35) return 'wind';
  if (code <= 1) return 'sun';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 86) || code >= 95) return 'rain';
  return 'cloud';
};

// campionati aggiunti: la posizione dello stadio si cerca per nome (geocoding open-meteo), una volta sola per stadio,
// solo tra i risultati del paese del campionato (mai uno stadio omonimo dall'altra parte del mondo); risultato ricordato sul telefono
const GEO = {};
const geoMem = (k, v) => { try { if (v === undefined) { const x = localStorage.getItem(`sl-geo-${k}`); return x ? JSON.parse(x) : undefined; } localStorage.setItem(`sl-geo-${k}`, JSON.stringify(v)); } catch { /* memoria non disponibile */ } return undefined; };
async function geoStadium(name, fallback, country, city) {
  const key = `${String(name || fallback || '').toLowerCase()}|${String(city || '').toLowerCase()}`;
  if (key === '|') return null;
  if (!key) return null;
  if (GEO[key] !== undefined) return GEO[key];
  const saved = geoMem(key);
  if (saved !== undefined) { GEO[key] = saved; return saved; }
  const tries = [name, String(name || '').replace(/\b(stadium|stadion|stadio|arena|park|ground|estadio|estádio|stade)\b/gi, '').trim(), city, fallback].filter((x) => x && x.length > 2);
  const plain = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  // il punto esatto dello stadio da OpenStreetMap (nome + citta'), poi il geocoding di open-meteo per nome/citta'
  if (name) {
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent([name, city].filter(Boolean).join(', '))}&format=json&limit=1`, { headers: { Accept: 'application/json' } });
      const d = await r.json();
      const h = d && d[0] && /stadium|sports|pitch|arena|football|soccer|leisure|amenity|building/i.test(`${d[0].class} ${d[0].type}`) ? d[0] : null;
      if (h) { GEO[key] = { lat: Number(h.lat), lon: Number(h.lon) }; geoMem(key, GEO[key]); return GEO[key]; }
    } catch { /* si prova con open-meteo */ }
  }
  for (const q of tries) {
    try {
      const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=10&language=en`);
      const d = await r.json();
      const hit = d && d.results && d.results.find((x) => !country || plain(x.country) === plain(country));
      if (hit) { GEO[key] = { lat: hit.latitude, lon: hit.longitude }; geoMem(key, GEO[key]); return GEO[key]; }
    } catch { /* si prova con il nome successivo */ }
  }
  GEO[key] = null;
  return null;
}

// stadi di tutte le squadre (stadi_extra.py), scaricati solo quando serve
let EX = null;
const stadiEx = () => { if (!EX) EX = fetch(`${BASE}stadi_ex.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({})); return EX; };

// stadi noti per nome (stadi.json, stadi_ex.json, stadio FotMob delle rose): le nazionali giocano negli stadi dei club
const nrmS = (x) => String(x || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
let BYNAME = null;
async function stadiByName(name) {
  if (!name) return null;
  if (!BYNAME) {
    BYNAME = new Map();
    const add = (n, lat, lon) => { const k = nrmS(n); if (k && lat != null && lon != null && Math.abs(lat) <= 90 && !BYNAME.has(k)) BYNAME.set(k, { s: n, lat, lon }); };
    Object.values(RAW.stadi || {}).forEach((e) => e && add(e.s, e.lat, e.lon));
    Object.values(await stadiEx()).forEach((e) => e && add(e.s, e.lat, e.lon));
    await loadRose().catch(() => null);
  }
  return BYNAME.get(nrmS(name)) || null;
}

export async function loadWeather(m) {
  if (m.weather) return m.weather;
  if (CACHE[m.id] !== undefined) return CACHE[m.id];
  const home = teamById(m.homeId);
  let st = home && RAW.stadi && RAW.stadi[home.name];
  const days = Math.round((Date.now() - m.ts) / 86400000);
  if (!st || !st.lat) await loadRose().catch(() => null);
  // stadio della squadra di casa da FotMob (rosa: nome, coordinate, citta')
  const ro = home && roseOf(home);
  if ((!st || !st.lat) && ro && ro.v && ro.v[1] != null) {
    st = { s: ro.v[0], lat: ro.v[1], lon: ro.v[2] };
    if (!m.stadium && ro.v[0]) m.stadium = ro.v[0];
  }
  if (!st || !st.lat) {
    const fid = teamFmId(home);
    const ex = fid ? (await stadiEx())[String(fid)] : null;
    if (ex) { st = ex; if (!m.stadium && ex.s) m.stadium = ex.s; }
  }
  if ((!st || !st.lat) && m.stadium) st = await stadiByName(m.stadium);
  // nessuna coordinata nota: nome dello stadio, poi citta' (stadio o squadra di casa senza sigle), nel paese del campionato; vale per OGNI partita
  if ((!st || !st.lat) && (m.stadium || m.stadiumCity || home)) {
    const ie = m.archive ? await archIndex().catch(() => null) : null;
    const cn = ie && m.archive && ie[String(m.archive.fm)] && ie[String(m.archive.fm)].cn;
    const city = String((home && home.name) || '').replace(/\b(fc|sc|ac|cf|bk|if|fk|sk|afc|cd|ud|sd|rc|as|us|ss|sv|vfb|vfl|tsv|fsv|1\.|u\d\d|ii|b)\b/gi, ' ').replace(/\s+/g, ' ').trim();
    st = await geoStadium(m.stadium, (m.archive || m.extra) ? (city || (home && home.name)) : null, /europe|world|international/i.test(cn || '') ? null : cn, m.stadiumCity);
  }
  if (!st || !st.lat) return null;
  if (days < -5) return null; // previsione disponibile da 5 giorni prima, per tutte le partite
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
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${st.lat}&longitude=${st.lon}&hourly=temperature_2m,wind_speed_10m,weather_code&timezone=GMT&past_days=${Math.max(1, Math.min(92, days + 1))}&forecast_days=8`;
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
