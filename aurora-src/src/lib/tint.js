// Sfumature nei colori sociali: righe dei giocatori e testata della partita.
export const teamGrad = (team, a = 0x55) => {
  const c = team && team.colors ? team.colors[0] : '#2C3E66';
  return `linear-gradient(100deg, ${c}${a.toString(16).padStart(2, '0')}, rgba(255,255,255,.03) 70%)`;
};
export const teamColor = (team) => (team && team.colors ? team.colors[0] : '#2C3E66');
// Riquadro a pillola nel colore del campionato (tinta unica scelta per ogni competizione).
export const tintGrad = (c, a = 0x40) => `linear-gradient(100deg, ${c}${a.toString(16).padStart(2, '0')}, rgba(255,255,255,.03) 70%)`;

// ── Colori di una partita (regola fissa): ogni squadra col suo colore sociale principale; se i due principali si
// somigliano, la squadra in trasferta passa al suo secondario; se anche quello somiglia, al colore piu' lontano tra i suoi
// (o all'accento del tema). Cosi' le due squadre hanno sempre colori diversi in banner, statistiche, momentum, cronologia.
const rgb = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(String(h || '').trim()); if (!m) return null; const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
// distanza percepita (redmean): ~0 uguali, >120 ben diversi
export const colorDist = (a, b) => {
  const p = rgb(a); const q = rgb(b); if (!p || !q) return 999;
  const r = (p[0] + q[0]) / 2; const dr = p[0] - q[0]; const dg = p[1] - q[1]; const db = p[2] - q[2];
  return Math.sqrt((2 + r / 256) * dr * dr + 4 * dg * dg + (2 + (255 - r) / 256) * db * db);
};
const SAME = 130;
const PAIR = new Map(); // cache piccola: stessa coppia, stessi colori a ogni disegno
export function matchColors(home, away) {
  const hc = (home && home.colors) || [teamColor(home)];
  const ac = (away && away.colors) || [teamColor(away)];
  const key = `${hc.join()}|${ac.join()}`;
  if (PAIR.has(key)) return PAIR.get(key);
  const h = hc[0];
  let a = ac[0];
  if (colorDist(h, a) < SAME) {
    const alt = ac.slice(1).find((c) => colorDist(h, c) >= SAME);
    a = alt || [...ac.slice(1), '#4DA8FF'].sort((x, y) => colorDist(h, y) - colorDist(h, x))[0] || a;
  }
  const out = [h, a];
  if (PAIR.size > 400) PAIR.delete(PAIR.keys().next().value);
  PAIR.set(key, out);
  return out;
}
// colore leggibile sopra il colore sociale (bianco/quasi nero)
export const inkOn = (c) => { const p = rgb(c); if (!p) return '#fff'; return (p[0] * 299 + p[1] * 587 + p[2] * 114) / 1000 > 150 ? '#0F172A' : '#fff'; };
// colore sociale scuro (nero, blu notte) schiarito verso il bianco quel tanto che basta per leggersi su fondo scuro
// (luminosita' minima ~125); restituisce sempre un esadecimale, valido anche in SVG e nell'app nativa
const hex = (p) => `#${p.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
const lum = (p) => (p[0] * 299 + p[1] * 587 + p[2] * 114) / 1000;
// schiarisce alzando la luminosita' (HSL) e tenendo tinta e saturazione: il blu Inter resta un blu acceso, non diventa lilla
const toHsl = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b); const mn = Math.min(r, g, b); const l = (mx + mn) / 2; if (mx === mn) return [0, 0, l]; const d = mx - mn; const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [h / 6, s, l]; };
const fromHsl = ([h, s, l]) => { if (!s) return [l * 255, l * 255, l * 255]; const q = l < 0.5 ? l * (1 + s) : l + s - l * s; const p = 2 * l - q; const f = (t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; }; return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255]; };
export const shown = (c, min = 125) => {
  const p = rgb(c); if (!p) return c;
  if (lum(p) >= min) return c;
  const [h, s, l0] = toHsl(p);
  let l = l0;
  let q = p;
  while (l < 0.92 && lum(q) < min) { l += 0.02; q = fromHsl([h, s, l]); }
  return hex(q);
};
